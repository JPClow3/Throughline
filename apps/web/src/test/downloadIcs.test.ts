import { expect, test, vi } from "vitest";
import { downloadIcs } from "../lib/downloadIcs";

test("downloadIcs creates and clicks a link", () => {
  const createElementSpy = vi.spyOn(document, "createElement");
  const mockAnchor = {
    href: "",
    download: "",
    click: vi.fn(),
  } as any;
  createElementSpy.mockReturnValue(mockAnchor);
  
  const createObjectURLSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
  const revokeObjectURLSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

  downloadIcs([], []);

  expect(createElementSpy).toHaveBeenCalledWith("a");
  expect(mockAnchor.click).toHaveBeenCalled();
  expect(mockAnchor.download).toBe("liquidglass-study-quests.ics");
  expect(createObjectURLSpy).toHaveBeenCalled();
  expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:test");

  createElementSpy.mockRestore();
  createObjectURLSpy.mockRestore();
  revokeObjectURLSpy.mockRestore();
});
