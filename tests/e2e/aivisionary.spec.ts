import { expect, test } from "@playwright/test";

test("home loads and navigates to product detail", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "AI Voice Generator Pro" })).toBeVisible();
  await page.goto("/san-pham");
  await page.getByRole("link", { name: "Auto Reup Master" }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Auto Reup Master" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("contact form validates and submits fallback", async ({ page }) => {
  await page.goto("/lien-he");
  await page.getByLabel("Họ tên").fill("Nguyen Van A");
  await page.getByLabel("Email").fill("a@example.com");
  await page.getByLabel("Nội dung").fill("Tôi cần tư vấn sản phẩm Auto Reup Master.");
  await page.getByRole("form", { name: "Form liên hệ" }).evaluate((form) => {
    if (form instanceof HTMLFormElement) form.requestSubmit();
  });
  await expect(page.getByRole("status")).toContainText("Đã nhận liên hệ");
});
