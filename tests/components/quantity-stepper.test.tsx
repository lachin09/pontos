import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { QuantityStepper } from "@/components/ui/quantity-stepper";

describe("QuantityStepper", () => {
  it("names the buttons after the item and calls back", async () => {
    const onIncrease = vi.fn();
    const onDecrease = vi.fn();
    render(
      <QuantityStepper
        value={2}
        itemName="Пальто"
        onIncrease={onIncrease}
        onDecrease={onDecrease}
        canIncrease
        canDecrease
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Збільшити кількість Пальто" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Зменшити кількість Пальто" }),
    );
    expect(onIncrease).toHaveBeenCalledOnce();
    expect(onDecrease).toHaveBeenCalledOnce();
    expect(screen.getByLabelText("Кількість")).toHaveTextContent("2");
  });

  it("disables the buttons at the limits", () => {
    render(
      <QuantityStepper
        value={1}
        onIncrease={() => {}}
        onDecrease={() => {}}
        canIncrease={false}
        canDecrease={false}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Зменшити кількість" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Збільшити кількість" }),
    ).toBeDisabled();
  });
});
