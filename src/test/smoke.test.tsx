import { describe, it, expect } from "vitest";
import { renderWithProviders } from "./utils";

function TestComponent() {
  return <div data-testid="hello">Hello Test</div>;
}

describe("Test infrastructure", () => {
  it("renders a component with providers", () => {
    const { getByTestId } = renderWithProviders(<TestComponent />);
    expect(getByTestId("hello")).toBeInTheDocument();
    expect(getByTestId("hello")).toHaveTextContent("Hello Test");
  });
});
