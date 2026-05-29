import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CharacterModal from "../CharacterModal";

describe("CharacterModal", () => {
  it("should not render when not open", () => {
    const { container } = render(<CharacterModal isOpen={false} onClose={() => {}} onSave={() => {}} />);
    expect(container.innerHTML).toBe("");
  });

  it("should render form when open", () => {
    render(<CharacterModal isOpen={true} onClose={() => {}} onSave={() => {}} />);
    expect(screen.getByText("新建角色")).toBeTruthy();
  });

  it("should show validation error when name is empty", () => {
    render(<CharacterModal isOpen={true} onClose={() => {}} onSave={() => {}} />);
    fireEvent.click(screen.getByText("创建"));
    expect(screen.getByText("角色名称不能为空")).toBeTruthy();
  });

  it("should call onSave with form data", () => {
    const onSave = vi.fn();
    render(<CharacterModal isOpen={true} onClose={() => {}} onSave={onSave} />);
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "Alice" } });
    fireEvent.change(inputs[1], { target: { value: "A brave hero" } });
    fireEvent.click(screen.getByText("创建"));
    expect(onSave).toHaveBeenCalledWith({ name: "Alice", description: "A brave hero", traits: [] });
  });

  it("should pre-fill form when editing", () => {
    render(<CharacterModal isOpen={true} onClose={() => {}} onSave={() => {}}
      character={{ id: "1", projectId: "p1", name: "Bob", description: "Sidekick", traits: ["loyal"] }} />);
    expect(screen.getByText("编辑角色")).toBeTruthy();
  });
});