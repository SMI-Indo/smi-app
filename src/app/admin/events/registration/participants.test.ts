import { expect, it } from "vitest";
import { participantPage, participantSearch, participantWhere } from "./participants";

it("normalizes a query and searches literal text within one event", () => {
  const query = participantSearch("  St_100%  ");
  const match = { contains: "St\\_100\\%", mode: "insensitive" };
  expect(participantWhere("event-1", query)).toEqual({
    eventId: "event-1",
    OR: [{ name: match }, { email: match }, { community: match }, { category: match }, { id: match }],
  });
  expect(participantWhere("event-1", "")).toEqual({ eventId: "event-1" });
  expect(participantSearch(["first", "second"])).toBe("first");
});

it("bounds pagination to the result set, including when the last participant was removed", () => {
  expect(participantPage("2", 30)).toEqual({ page: 2, pages: 2, skip: 25 });
  expect(participantPage("9999999999", 26)).toEqual({ page: 2, pages: 2, skip: 25 });
  expect(participantPage("2", 25)).toEqual({ page: 1, pages: 1, skip: 0 });
  expect(participantPage("-10", 70)).toEqual({ page: 1, pages: 3, skip: 0 });
  expect(participantPage("2", 0)).toEqual({ page: 1, pages: 1, skip: 0 });
});
