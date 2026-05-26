import { test, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MainContent } from "../main-content";

vi.mock("@/lib/contexts/chat-context", () => ({
  ChatProvider: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/chat/ChatInterface", () => ({
  ChatInterface: () => <div data-testid="chat-interface" />,
}));

vi.mock("@/components/editor/FileTree", () => ({
  FileTree: () => <div data-testid="file-tree" />,
}));

vi.mock("@/components/editor/CodeEditor", () => ({
  CodeEditor: () => <div data-testid="code-editor" />,
}));

vi.mock("@/components/preview/PreviewFrame", () => ({
  PreviewFrame: () => <div data-testid="preview-frame" />,
}));

vi.mock("@/components/HeaderActions", () => ({
  HeaderActions: () => <div data-testid="header-actions" />,
}));

vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({ children }: any) => <div>{children}</div>,
  ResizablePanel: ({ children }: any) => <div>{children}</div>,
  ResizableHandle: () => <div />,
}));

afterEach(() => {
  cleanup();
});

test("renders Preview view by default", () => {
  render(<MainContent />);
  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.queryByTestId("code-editor")).toBeNull();
});

test("clicking Code toggle shows the code editor", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  await user.click(screen.getByRole("tab", { name: "Code" }));

  expect(screen.getByTestId("code-editor")).toBeDefined();
  expect(screen.getByTestId("file-tree")).toBeDefined();
  expect(screen.queryByTestId("preview-frame")).toBeNull();
});

test("clicking Preview toggle after Code shows the preview", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  await user.click(screen.getByRole("tab", { name: "Code" }));
  await user.click(screen.getByRole("tab", { name: "Preview" }));

  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.queryByTestId("code-editor")).toBeNull();
});

test("toggle continues to work after repeated clicks", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  const preview = () => screen.getByRole("tab", { name: "Preview" });
  const code = () => screen.getByRole("tab", { name: "Code" });

  for (let i = 0; i < 5; i++) {
    await user.click(code());
    expect(screen.getByTestId("code-editor")).toBeDefined();
    expect(code().getAttribute("data-state")).toBe("active");
    expect(preview().getAttribute("data-state")).toBe("inactive");

    await user.click(preview());
    expect(screen.getByTestId("preview-frame")).toBeDefined();
    expect(preview().getAttribute("data-state")).toBe("active");
    expect(code().getAttribute("data-state")).toBe("inactive");
  }
});

test("clicking the same toggle twice keeps it active", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  const code = () => screen.getByRole("tab", { name: "Code" });

  await user.click(code());
  expect(code().getAttribute("data-state")).toBe("active");

  await user.click(code());
  expect(code().getAttribute("data-state")).toBe("active");
  expect(screen.getByTestId("code-editor")).toBeDefined();
});
