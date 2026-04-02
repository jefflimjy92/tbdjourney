const { chromium } = require("playwright");
const path = require("path");

const outDir = path.resolve("docs/assets/admin-journey-guide");

const shots = [
  { file: "01-requests.png", action: async () => {} },
  { file: "02-leads.png", action: async (page) => { await page.getByText("DB 분류/배정").click(); } },
  { file: "03-consultation.png", action: async (page) => { await page.getByText("상담/TM").click(); } },
  { file: "04-handoff.png", action: async (page) => { await page.getByText("미팅 인계").click(); } },
  {
    file: "05-claims-doc.png",
    action: async (page) => {
      await page.getByText("청구/분석").click();
      await page.getByText("서류 발급", { exact: true }).click();
    },
  },
  {
    file: "06-aftercare.png",
    action: async (page) => {
      await page.getByText("지급/사후").click();
      await page.getByText("사후 관리").click();
    },
  },
  {
    file: "07-referral.png",
    action: async (page) => {
      await page.getByText("Growth Loop").click();
      await page.getByText("소개 관리").click();
    },
  },
  { file: "08-compliance.png", action: async (page) => { await page.getByText("준법/개인정보").click(); } },
  { file: "09-admin-ops.png", action: async (page) => { await page.getByText("관리업무").click(); } },
  { file: "10-daily-report.png", action: async (page) => { await page.getByText("일일 보고서").click(); } },
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } });

  for (const shot of shots) {
    try {
      await page.goto("http://127.0.0.1:4173", { waitUntil: "domcontentloaded", timeout: 20000 });
      await page.waitForTimeout(2000);
      await shot.action(page);
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(outDir, shot.file), fullPage: true });
      console.log(`saved ${shot.file}`);
    } catch (error) {
      console.error(`failed ${shot.file}: ${error.message}`);
    }
  }

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
