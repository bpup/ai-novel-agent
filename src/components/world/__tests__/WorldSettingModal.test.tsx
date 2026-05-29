import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import WorldSettingModal from "../WorldSettingModal";

describe("WorldSettingModal", () => {
  it("should not render when not open", () => {
    const { container } = render(<WorldSettingModal isOpen={false} onClose={() => {}} onSave={() => {}} />);
    expect(container.innerHTML).toBe("");
  });

  it("should render form when open", () => {
    render(<WorldSettingModal isOpen={true} onClose={() => {}} onSave={() => {}} />);
    expect(screen.getByText("新建世界观设定")).toBeTruthy();
  });

  it("should show validation error when name is empty", () => {
    render(<WorldSettingModal isOpen={true} onClose={() => {}} onSave={() => {}} />);
    fireEvent.click(screen.getByText("创建"));
    expect(screen.getByText("名称不能为空")).toBeTruthy();
  });

  it("should call onSave with form data", () => {
    const onSave = vi.fn();
    render(<WorldSettingModal isOpen={true} onClose={() => {}} onSave={onSave} />);
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "Magic System" } });
    fireEvent.change(inputs[1], { target: { value: "Rules of magic" } });
    fireEvent.change(inputs[2], { target: { value: "magic" } });
    fireEvent.click(screen.getByText("创建"));
    expect(onSave).toHaveBeenCalledWith({ name: "Magic System", description: "Rules of magic", category: "magic" });
  });
});