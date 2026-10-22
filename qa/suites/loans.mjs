import { WIDTHS, overflowReport, scrollThrough, trackLayoutShift, watch } from "../lib.mjs";

const PAGES = ["/loans", "/loans/apply", "/loans/LN410231", "/loans/LN410774", "/loans/LN409118", "/loans/LN408502"];

const emi = (amount, apr, months) => {
  const r = apr / 12 / 100;
  return Math.round(((amount * r) / (1 - Math.pow(1 + r, -months))) * 100) / 100;
};
const money = (n) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pdf = (name) => ({ name, mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 mock") });

const DOCS = ["Passport", "Visa / residence permit", "Employment proof", "Salary slips / income proof", "Address proof", "Bank statement"];

export default async function run({ browser, base: BASE, t }) {
  const { check, section } = t;
  const mobile = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true };

  // Choose an option in a HeroUI Select by its label.
  async function choose(page, label, option) {
    await page.getByRole("button", { name: new RegExp(label) }).first().tap();
    await page.getByRole("option", { name: option }).first().tap();
    await page.waitForTimeout(250);
  }

  // ---------------------------------------------------------------- 1. every page, every width
  section("loans 1. responsive: overflow, layout shift, console");
  for (const path of PAGES) {
    for (const w of WIDTHS) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 800 } });
      const page = await ctx.newPage();
      const logs = watch(page);
      await trackLayoutShift(page);
      await page.goto(BASE + path, { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      await scrollThrough(page);
      const m = await overflowReport(page);
      check(`${path} @${w} no horizontal overflow`, m.scrollWidth <= m.innerWidth && m.offenders.length === 0, JSON.stringify(m.offenders?.slice?.(0, 3) ?? ""));
      check(`${path} @${w} layout shift ${m.cls.toFixed(3)} (<= 0.1)`, m.cls <= 0.1);
      check(`${path} @${w} no console errors or hydration issues`, logs.length === 0, logs.join(" | "));
      await ctx.close();
    }
  }

  // ---------------------------------------------------------------- 2. landing
  section("loans 2. landing page");
  {
    const ctx = await browser.newContext(mobile);
    const page = await ctx.newPage();
    await page.goto(BASE + "/loans", { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    const headings = ["Loan options", "Why choose RideGo Expat Loan", "Eligibility highlights", "Loan calculator", "How it works", "Required documents", "Frequently asked questions", "Your applications"];
    for (const name of headings) check(`landing has "${name}"`, (await page.getByRole("heading", { name }).count()) === 1);
    check("hero: Loans made simpler for expats", (await page.getByRole("heading", { name: "Loans made simpler for expats" }).count()) === 1);
    check("hero has Check eligibility and How it works", (await page.getByRole("link", { name: "Check eligibility" }).first().isVisible()) && (await page.getByRole("link", { name: "How it works" }).isVisible()));
    check("three loan options with a View details link", (await page.locator("section[aria-labelledby='types'] li").count()) === 3 && (await page.getByRole("link", { name: "View details" }).count()) === 3);
    check("four reasons to choose", (await page.locator("section[aria-labelledby='why'] li").count()) === 4);
    check("six eligibility requirements", (await page.locator("section[aria-labelledby='eligibility'] ul li").count()) === 6);
    check("six required documents, each marked Required", (await page.locator("section[aria-labelledby='docs'] li").count()) === 6 && (await page.locator("section[aria-labelledby='docs'] li", { hasText: "Required" }).count()) === 6);
    check("four numbered steps", (await page.locator("section[aria-labelledby='how-title'] li").count()) === 4);
    check("landing shows the bottom nav (tab-level screen)", (await page.locator("nav[aria-label='Primary']:visible").count()) === 1);
    await page.getByRole("button", { name: "Are there any fees?" }).tap();
    await page.waitForTimeout(400);
    check("FAQ opens", await page.getByText(/already includes interest/).isVisible());
    check("Need help card has a call link", (await page.getByRole("link", { name: /1800 000 000/ }).count()) === 1);

    // Calculator: default 5000 / 24 months / 12%.
    const out = async () => (await page.getByTestId("emi").innerText()).trim();
    check("calculator shows the EMI for the defaults", (await out()) === money(emi(5000, 12, 24)), await out());
    check("calculator lists principal, interest and total", (await page.locator("section[aria-labelledby='calc']").innerText()).includes("Total repayment"));
    await page.getByRole("group", { name: "Tenure in months" }).getByRole("button", { name: "36", exact: true }).tap();
    await page.waitForTimeout(300);
    check("changing tenure changes the EMI", (await out()) === money(emi(5000, 12, 36)), await out());
    const rate = page.getByRole("slider", { name: /Interest rate/ });
    await rate.focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(300);
    check("the interest-rate slider changes the EMI (keyboard)", (await out()) === money(emi(5000, 13, 36)), await out());
    const href = await page.getByRole("link", { name: "Apply for this loan" }).getAttribute("href");
    check("Apply carries the chosen loan into the form", href === "/loans/apply?type=personal&amount=5000&tenure=36", href);
    await ctx.close();
  }

  // ---------------------------------------------------------------- 3. application flow
  section("loans 3. application flow (end to end)");
  {
    const ctx = await browser.newContext(mobile);
    const page = await ctx.newPage();
    const logs = watch(page);
    await page.goto(BASE + "/loans/apply?type=vehicle&amount=5000&tenure=48", { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    const next = () => page.locator("[data-testid='flow-footer']:visible").getByRole("button").last();
    const step = async () => (await page.getByText(/^Step \d of 5/).first().innerText()).trim();
    const stepTitle = async () => (await page.locator("main p.text-xl").first().innerText()).trim();

    check("stepper shows five numbered steps", (await page.getByRole("list", { name: "Application progress" }).locator("li").count()) === 5);
    check(
      "step 1 is Loan details, prefilled from the calculator",
      (await stepTitle()) === "Loan details" && (await page.getByLabel("Required amount (USD)").inputValue()) === "5000" && (await page.getByRole("button", { name: "Vehicle" }).getAttribute("aria-pressed")) === "true",
    );
    check("shows the estimated monthly payment", (await page.getByTestId("emi-preview").innerText()).includes(money(emi(5000, 9.5, 48))));
    check("footer shows the monthly payment, not a total", (await page.locator("[data-testid='flow-footer']:visible").innerText()).includes("Monthly payment"));

    // The amount slider and the field stay in step.
    const slider = page.getByRole("slider", { name: /Required amount/ });
    await slider.focus();
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(300);
    check("the amount slider updates the field", (await page.getByLabel("Required amount (USD)").inputValue()) === "5500", await page.getByLabel("Required amount (USD)").inputValue());

    // Switching loan type clamps to that type's limits.
    await page.getByRole("button", { name: "Emergency" }).tap();
    await page.waitForTimeout(300);
    check("switching to Emergency clamps the amount to its maximum", (await page.getByLabel("Required amount (USD)").inputValue()) === "5000", await page.getByLabel("Required amount (USD)").inputValue());
    await page.getByRole("button", { name: "Vehicle" }).tap();
    await page.waitForTimeout(200);

    await page.getByLabel("Required amount (USD)").fill("999999");
    await next().tap();
    await page.waitForTimeout(400);
    check("amount above the maximum is rejected", (await page.getByText(/Enter between \$1,500 and \$15,000/).count()) === 1);
    check("purpose is required", (await page.getByText("Choose a purpose for the loan.").count()) === 1);
    check("still on step 1", (await step()).startsWith("Step 1 of 5"));
    await page.getByLabel("Required amount (USD)").fill("6000");
    await choose(page, "Purpose of loan", "Relocation costs");
    await page.getByRole("group", { name: "Preferred tenure (months)" }).getByRole("button", { name: "36", exact: true }).tap();
    await page.waitForTimeout(250);
    check("tenure chip updates the estimate", (await page.getByTestId("emi-preview").innerText()).includes(money(emi(6000, 9.5, 36))));
    await next().tap();
    await page.waitForURL(/step=2/);
    await page.waitForTimeout(500);

    // Step 2 personal.
    check("step 2 is Personal details", (await stepTitle()) === "Personal details");
    await page.getByLabel("Full name").fill("");
    await next().tap();
    await page.waitForTimeout(400);
    check("empty personal form shows errors", (await page.getByText("Enter your full name as on your passport.").count()) === 1 && (await page.getByText("Enter your date of birth.").count()) === 1);
    await page.getByLabel("Full name").fill("Ana Silva");
    await page.getByLabel("Mobile number").fill("+971 50 123 4567");
    await page.getByLabel("Email").fill("ana@example.com");
    await page.getByLabel("Date of birth").fill("2015-01-01");
    await page.getByLabel("Nationality").fill("Portuguese");
    await page.getByLabel("Current city").fill("Dubai");
    await choose(page, "Visa or residence status", "Employment visa");
    await next().tap();
    await page.waitForTimeout(400);
    check("under-21 date of birth is rejected", (await page.getByText("You must be between 21 and 60 years old.").count()) === 1);
    await page.getByLabel("Date of birth").fill("1990-06-15");
    await next().tap();
    await page.waitForURL(/step=3/);
    await page.waitForTimeout(500);

    // Step 3 employment.
    check("step 3 is Employment & income", (await stepTitle()) === "Employment & income");
    await next().tap();
    await page.waitForTimeout(400);
    check("empty employment form shows errors", (await page.getByText("Choose your employment type.").count()) === 1 && (await page.getByText("Enter your job title.").count()) === 1);
    await page.getByRole("button", { name: "Salaried" }).tap();
    await page.getByLabel("Employer or business").fill("Northwind Logistics");
    await page.getByLabel("Job title").fill("Operations Lead");
    await page.getByLabel("Monthly income (USD)").fill("100");
    await choose(page, "Work experience", "3 to 5 years");
    await choose(page, "active bank account", "Yes");
    await page.waitForTimeout(300);
    check("warns when the payment is over half the income", (await page.getByText(/above half of this income/).count()) === 1);
    await page.getByLabel("Monthly income (USD)").fill("3200");
    await page.waitForTimeout(300);
    check("warning clears with enough income", (await page.getByText(/above half of this income/).count()) === 0);
    await next().tap();
    await page.waitForURL(/step=4/);
    await page.waitForTimeout(500);

    // Step 4 documents.
    check("step 4 is Documents with six rows", (await stepTitle()) === "Documents" && (await page.locator("main label", { hasText: "Upload" }).count()) === 6);
    check("Continue is disabled until all six documents are added", await next().isDisabled());
    for (const [i, n] of DOCS.entries()) {
      await page.getByLabel(`Upload ${n}`).setInputFiles(pdf(`doc-${i + 1}.pdf`));
      await page.waitForTimeout(150);
    }
    check("all six files are listed", (await page.getByTestId("file-name").count()) === 6);
    await page.getByRole("button", { name: "Remove Passport" }).tap();
    await page.waitForTimeout(200);
    check("removing a file disables Continue again", (await next().isDisabled()) && (await page.getByTestId("file-name").count()) === 5);
    await page.getByLabel("Upload Passport").setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("x") });
    await page.waitForTimeout(200);
    check("a non PDF/JPG/PNG file is refused", (await page.getByText("Use a PDF, JPG or PNG file.").count()) === 1);
    await page.getByLabel("Upload Passport").setInputFiles(pdf("doc-1.pdf"));
    await page.waitForTimeout(200);
    await next().tap();
    await page.waitForURL(/step=5/);
    await page.waitForTimeout(500);

    // System Back goes to the previous step.
    await page.goBack();
    await page.waitForURL(/step=4/);
    check("system Back returns to the documents step", (await stepTitle()) === "Documents");
    await page.goForward();
    await page.waitForURL(/step=5/);
    await page.waitForTimeout(400);

    // Step 5 review.
    check("step 5 is Review & submit", (await stepTitle()) === "Review & submit");
    const review = await page.locator("main").innerText();
    check(
      "review lists loan, personal, employment and documents",
      ["Vehicle Loan", "$6,000.00", "Relocation costs", "Ana Silva", "Portuguese", "Northwind Logistics", "Operations Lead", "6 of 6 documents", "doc-6.pdf"].every((s) => review.includes(s)),
      review.slice(0, 300),
    );
    check("every review card has an Edit button", (await page.getByRole("button", { name: /^Edit/ }).count()) === 4);
    check("submit is disabled until the statement is accepted", await next().isDisabled());
    await page.getByText("I confirm that all the information provided").tap();
    await page.waitForTimeout(200);
    check("accepting enables submit", !(await next().isDisabled()));
    await next().tap();
    await page.waitForURL(/\/loans\/LN\d+$/, { timeout: 8000 });
    await page.waitForTimeout(700);

    // Status page for the new application.
    const ref = (await page.getByTestId("loan-ref").innerText()).trim();
    check("status page shows the new reference", /^LN\d+$/.test(ref), ref);
    check("new application: headline Application submitted", (await page.getByTestId("status-headline").innerText()) === "Application submitted");
    const mainText = await page.locator("main").innerText();
    check("shows Submitted on, loan type and amount", ["Submitted on", "Vehicle Loan", "$6,000.00"].every((s) => mainText.includes(s)));
    const line = await page.getByRole("list", { name: "Application progress" }).innerText();
    check("timeline: Submitted, Documents under review, Eligibility review, Final decision", ["Submitted", "Documents under review", "Eligibility review", "Final decision"].every((s) => line.includes(s)), line);

    // Back from the status screen skips the finished flow.
    await page.getByRole("button", { name: "Go back" }).tap();
    await page.waitForURL(BASE + "/loans");
    await page.waitForTimeout(500);
    check("Back from status goes to the loans page", new URL(page.url()).pathname === "/loans");
    check("new application is listed", (await page.getByText(ref).count()) >= 1);
    check("draft is cleared after submitting", (await page.evaluate(() => sessionStorage.getItem("rgo.loan-draft.v2"))) === "null");

    // Jumping ahead by URL is clamped to the first step.
    await page.goto(BASE + "/loans/apply?step=5", { waitUntil: "networkidle" });
    await page.waitForTimeout(700);
    check("typing step=5 with no draft lands on step 1", /Step 1 of 5/.test(await step()), page.url());
    check("loans: no console errors/warnings", logs.length === 0, logs.join(" | "));
    await ctx.close();
  }

  // ---------------------------------------------------------------- 4. status screens
  section("loans 4. application status");
  {
    const ctx = await browser.newContext(mobile);
    const page = await ctx.newPage();
    const logs = watch(page);

    const open = async (ref) => {
      await page.goto(BASE + `/loans/${ref}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(600);
    };
    const timeline = () => page.getByRole("list", { name: "Application progress" }).innerText();

    await open("LN410231");
    check(
      "in review: dark header with headline, reference and Submitted on",
      (await page.getByTestId("status-headline").innerText()) === "Application in review" && (await page.getByTestId("loan-ref").innerText()) === "LN410231" && (await page.getByText("Submitted on").count()) === 1,
    );
    check("in review: Eligibility review is in progress", /Eligibility review\s+In progress/.test(await timeline()), await timeline());
    check("in review: no document request", (await page.getByText("Documents requested").count()) === 0);
    check("in review: notification note and support link", (await page.getByText(/We will notify you once there is an update/).count()) === 1 && (await page.getByRole("link", { name: "Contact support" }).isVisible()));

    // Additional document while the application is open.
    await page.getByRole("button", { name: "Upload additional document" }).tap();
    await page.waitForTimeout(300);
    await page.getByLabel("Upload Additional document").setInputFiles(pdf("extra.pdf"));
    await page.waitForTimeout(600);
    check("an additional document is recorded on the timeline", (await timeline()).includes("Additional document received: extra.pdf"));

    await open("LN409118");
    check(
      "approved: headline, note and a final stage titled Approved",
      (await page.getByTestId("status-headline").innerText()) === "Application approved" && (await page.getByText("Approved at the requested amount.").count()) === 1 && !(await timeline()).includes("Final decision"),
    );
    check("approved: no additional-document button", (await page.getByRole("button", { name: "Upload additional document" }).count()) === 0);

    await open("LN408502");
    check(
      "rejected: headline, the reason and Apply again",
      (await page.getByTestId("status-headline").innerText()) === "Application not approved" && (await page.getByText(/above 50% of the stated income/).count()) === 1 && (await page.getByRole("link", { name: "Apply again" }).isVisible()),
    );

    await open("LN410774");
    check("documents required: request panel names the document", (await page.getByText("Documents requested").isVisible()) && (await page.getByText("Please add: Address proof.").count()) === 1);
    check("documents required: reviewer note is in the timeline", (await page.getByText("The address proof is older than 3 months.").count()) === 1 && /Documents under review\s+Action needed/.test(await timeline()));
    const send = page.getByRole("button", { name: "Send documents" });
    check("Send documents is disabled until the file is added", await send.isDisabled());
    await page.getByLabel("Upload Address proof").setInputFiles(pdf("new-address-proof.pdf"));
    await page.waitForTimeout(200);
    await send.tap();
    await page.waitForTimeout(700);
    check("sending moves the application back to In review", (await page.getByTestId("status-headline").innerText()) === "Application in review" && (await page.getByText("Documents requested").count()) === 0);
    check("the new document is listed", (await page.locator("main").innerText()).includes("new-address-proof.pdf"));

    await page.goto(BASE + "/loans/LN000000", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    check("unknown reference shows a not-found state", (await page.getByText("Application not found").count()) === 1);
    check("status: no console errors/warnings", logs.length === 0, logs.join(" | "));
    await ctx.close();
  }

  // ---------------------------------------------------------------- 5. entry points
  section("loans 5. entry points");
  {
    const ctx = await browser.newContext(mobile);
    const page = await ctx.newPage();
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    check("Home has the Expat Loan card", (await page.getByRole("link", { name: /Expat Loan/ }).count()) === 1);
    await page.getByRole("link", { name: /Expat Loan/ }).tap();
    await page.waitForURL(BASE + "/loans");
    check("Home card opens the loans page", new URL(page.url()).pathname === "/loans");

    await page.goto(BASE + "/profile", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    await page.getByRole("link", { name: /Loans for expats/ }).tap();
    await page.waitForURL(BASE + "/loans");
    check("Profile links to the loans page", new URL(page.url()).pathname === "/loans");
    await ctx.close();

    const desktop = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const dp = await desktop.newPage();
    await dp.goto(BASE + "/loans", { waitUntil: "networkidle" });
    await dp.waitForTimeout(500);
    check("desktop: hero has a Check eligibility link and footer links to loans", (await dp.getByRole("link", { name: "Check eligibility" }).first().isVisible()) && (await dp.locator("footer[data-site-footer] a[href='/loans']").count()) === 1);
    await desktop.close();
  }
}
