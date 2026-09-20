import { expect, test, vi } from "vitest";
import { sampleTasks } from "@throughline/domain";
import { downloadIcs } from "../lib/downloadIcs";

function makeAnchor() {
  const createElementSpy = vi.spyOn(document, "createElement");
  const anchor = {
    href: "",
    download: "",
    click: vi.fn(),
    remove: vi.fn(),
  } as unknown as HTMLAnchorElement;
  createElementSpy.mockReturnValue(anchor);
  return { createElementSpy, mockAnchor: anchor };
}

test("downloadIcs creates and clicks a link", () => {
  const { createElementSpy, mockAnchor } = makeAnchor();
  const appendSpy = vi.spyOn(document.body, "appendChild").mockImplementation(((node: Node) => node) as typeof document.body.appendChild);

  const createObjectURLSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
  const revokeObjectURLSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

  downloadIcs(sampleTasks, []);

  expect(createElementSpy).toHaveBeenCalledWith("a");
  expect(mockAnchor.click).toHaveBeenCalled();
  expect(mockAnchor.download).toBe("throughline.ics");
  expect(createObjectURLSpy).toHaveBeenCalled();

  createElementSpy.mockRestore();
  appendSpy.mockRestore();
  createObjectURLSpy.mockRestore();
  revokeObjectURLSpy.mockRestore();
});

test("downloadIcs throws when there is nothing to export", () => {
  expect(() => downloadIcs([], [])).toThrow("No due tasks");
});
