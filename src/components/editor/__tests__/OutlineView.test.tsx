import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import OutlineView from "../OutlineView";

const mockDataTransfer = () => ({
  effectAllowed: "",
  dropEffect: "",
  setData: vi.fn(),
  getData: vi.fn(),
});

function createDataTransfer(getDataReturn: string) {
  return {
    effectAllowed: "",
    dropEffect: "",
    setData: vi.fn(),
    getData: vi.fn(() => getDataReturn),
  };
}

describe("OutlineView", () => {
  it("renders H1, H2, H3 headings with correct indentation", () => {
    const html = "<h1>Chapter 1</h1><h2>Section 1.1</h2><h3>Subsection 1.1.1</h3>";
    render(<OutlineView html={html} onJump={vi.fn()} />);

    expect(screen.getByText("Chapter 1")).toBeInTheDocument();
    expect(screen.getByText("Section 1.1")).toBeInTheDocument();
    expect(screen.getByText("Subsection 1.1.1")).toBeInTheDocument();
  });

  it("shows progressive paddingLeft based on heading level", () => {
    const html = "<h1>A</h1><h2>B</h2><h3>C</h3>";
    render(<OutlineView html={html} onJump={vi.fn()} />);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);

    const h1Padding = parseInt(items[0].style.paddingLeft);
    const h2Padding = parseInt(items[1].style.paddingLeft);
    const h3Padding = parseInt(items[2].style.paddingLeft);

    expect(h2Padding).toBeGreaterThan(h1Padding);
    expect(h3Padding).toBeGreaterThan(h2Padding);
  });

  it("shows empty state message when there are no headings", () => {
    render(<OutlineView html="<p>No headings here</p>" onJump={vi.fn()} />);

    expect(screen.getByText("使用标题即可自动生成大纲")).toBeInTheDocument();
  });

  it("calls onJump with heading text when clicked", () => {
    const onJump = vi.fn();
    const html = "<h1>Important Heading</h1>";
    render(<OutlineView html={html} onJump={onJump} />);

    fireEvent.click(screen.getByText("Important Heading"));

    expect(onJump).toHaveBeenCalledWith("Important Heading");
    expect(onJump).toHaveBeenCalledTimes(1);
  });

  it("strips inner HTML tags from heading text", () => {
    const html = '<h1>Hello <strong>World</strong> <em>Test</em></h1>';
    render(<OutlineView html={html} onJump={vi.fn()} />);

    expect(screen.getByText("Hello World Test")).toBeInTheDocument();
  });

  it("skips headings with empty text after stripping tags", () => {
    const html = "<h1>Valid</h1><h2>   </h2><h3></h3><h2>Also Valid</h2>";
    render(<OutlineView html={html} onJump={vi.fn()} />);

    expect(screen.getByText("Valid")).toBeInTheDocument();
    expect(screen.getByText("Also Valid")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("sets effectAllowed and setData on dragStart", () => {
    const html = "<h1>Drag Me</h1><h2>Target</h2>";
    render(<OutlineView html={html} onJump={vi.fn()} onReorder={vi.fn()} />);

    const items = screen.getAllByRole("listitem");
    const dt = mockDataTransfer();
    fireEvent.dragStart(items[0], { dataTransfer: dt });

    expect(dt.effectAllowed).toBe("move");
    expect(dt.setData).toHaveBeenCalledWith("text/plain", "0");
  });

  it("calls onReorder with reordered array on drop", () => {
    const onReorder = vi.fn();
    const html = "<h1>First</h1><h2>Second</h2><h3>Third</h3>";
    render(<OutlineView html={html} onJump={vi.fn()} onReorder={onReorder} />);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);

    const dt = createDataTransfer("0");
    fireEvent.dragStart(items[0], { dataTransfer: dt });

    const dt2 = createDataTransfer("0");
    fireEvent.dragOver(items[2], { dataTransfer: dt2 });
    fireEvent.drop(items[2], { dataTransfer: dt2 });

    expect(onReorder).toHaveBeenCalledTimes(1);
    const reordered = onReorder.mock.calls[0][0];
    expect(reordered).toHaveLength(3);
    expect(reordered[0].text).toBe("Second");
    expect(reordered[1].text).toBe("Third");
    expect(reordered[2].text).toBe("First");
  });

  it("does not call onReorder when dropping at same position", () => {
    const onReorder = vi.fn();
    const html = "<h1>Same</h1>";
    render(<OutlineView html={html} onJump={vi.fn()} onReorder={onReorder} />);

    const items = screen.getAllByRole("listitem");
    const dt = createDataTransfer("0");
    fireEvent.dragStart(items[0], { dataTransfer: dt });

    const dt2 = createDataTransfer("0");
    fireEvent.dragOver(items[0], { dataTransfer: dt2 });
    fireEvent.drop(items[0], { dataTransfer: dt2 });

    expect(onReorder).not.toHaveBeenCalled();
  });

  it("resets visual states on dragEnd", () => {
    const html = "<h1>A</h1><h2>B</h2>";
    render(<OutlineView html={html} onJump={vi.fn()} onReorder={vi.fn()} />);

    const items = screen.getAllByRole("listitem");
    const dt = createDataTransfer("0");
    fireEvent.dragStart(items[0], { dataTransfer: dt });

    const dt2 = createDataTransfer("0");
    fireEvent.dragOver(items[1], { dataTransfer: dt2 });
    fireEvent.dragEnd(items[0]);

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("includes the 大纲 header", () => {
    const html = "<h1>Test</h1>";
    render(<OutlineView html={html} onJump={vi.fn()} />);

    expect(screen.getByText("大纲")).toBeInTheDocument();
  });
});
