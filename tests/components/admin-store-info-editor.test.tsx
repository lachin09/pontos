import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import { EMPTY_STORE_INFO } from "@/lib/validators/store-info";

const saveStoreInfo = vi.fn();
vi.mock("@/lib/api/admin", () => ({ adminSettingsApi: { saveStoreInfo } }));

const { AdminStoreInfoEditor } =
  await import("@/components/admin/admin-store-info-editor");

function renderEditor(initialInfo = EMPTY_STORE_INFO) {
  const user = userEvent.setup();
  render(<AdminStoreInfoEditor initialInfo={initialInfo} />);
  return user;
}
const saveButton = () => screen.getByRole("button", { name: "Зберегти" });
const pageText = () => screen.getByLabelText(/Текст сторінки/);

beforeEach(() => vi.clearAllMocks());

describe("AdminStoreInfoEditor", () => {
  it("only enables saving once something changed", async () => {
    const user = renderEditor();
    expect(saveButton()).toBeDisabled();
    await user.type(screen.getByLabelText("Продавець"), "ФОП Коваль");
    expect(saveButton()).toBeEnabled();
    expect(screen.getByText("Є незбережені зміни")).toBeInTheDocument();
  });

  it("inserts a template and counts the placeholders left to fill", async () => {
    const user = renderEditor();
    await user.click(screen.getByRole("button", { name: "Вставити шаблон" }));
    expect((pageText() as HTMLTextAreaElement).value).toMatch(
      /^Цей документ є публічною пропозицією/,
    );
    expect(
      screen.getByText(/Незаповнених місць у \[дужках\]: \d+/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Вставити шаблон" }),
    ).not.toBeInTheDocument();
  });

  it("switches between pages and previews the formatted text", async () => {
    const user = renderEditor();
    await user.click(
      screen.getByRole("button", { name: /Обмін та повернення/ }),
    );
    expect(pageText()).toHaveAccessibleName(/Обмін та повернення/);
    await user.type(pageText(), "## Умови");
    expect(screen.getByRole("heading", { name: "Умови" })).toBeInTheDocument();
  });

  it("saves everything and confirms", async () => {
    saveStoreInfo.mockResolvedValue(undefined);
    const user = renderEditor();
    await user.type(screen.getByLabelText("Телефон"), "+380971234567");
    await user.type(pageText(), "Текст оферти");
    await user.click(saveButton());

    expect(saveStoreInfo).toHaveBeenCalledWith({
      seller: { ...EMPTY_STORE_INFO.seller, phone: "+380971234567" },
      pages: { ...EMPTY_STORE_INFO.pages, offer: "Текст оферти" },
    });
    expect(
      await screen.findByText("Збережено. Зміни вже на сайті."),
    ).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
    expect(
      screen.getByRole("link", { name: /Відкрити на сайті/ }),
    ).toHaveAttribute("href", "/info/offer");
  });

  it("shows the server's error when saving fails", async () => {
    saveStoreInfo.mockImplementation(async () => {
      throw new ApiError("Вкажіть коректну пошту", 400);
    });
    const user = renderEditor();
    await user.type(screen.getByLabelText("E-mail"), "wrong");
    await user.click(saveButton());
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Вкажіть коректну пошту",
    );
  });
});
