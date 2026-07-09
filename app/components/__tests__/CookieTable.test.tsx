import { render, screen } from "@testing-library/react";
import CookieTable from "../CookieTable";
import type { Cookie } from "@/types/cookies";

describe("Tests for CookieTable", () => {
  it("test to see if the table headers are displayed", () => {
    render(<CookieTable cookies={[]} />);

    expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Value" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Domain" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "SameSite" })).toBeInTheDocument();
  });

  it("test to see if the no cookies message is displayed", () => {
    render(<CookieTable cookies={[]} />);

    expect(screen.getByText("No cookies found for your request.")).toBeInTheDocument();
  });

  it("test to see if cookie rows are rendered for each cookie entry", () => {
    const cookies: Cookie[] = [
      {
        name: "session_id",
        value: "abc123",
        domain: "example.com",
        path: "/",
        expires: new Date("2026-12-31T23:59:59.000Z"),
        secure: true,
        httpOnly: true,
        sameSite: "Lax",
      },
      {
        name: "analytics",
        value: "enabled",
        domain: "example.com",
        path: "/app",
      },
    ];

    render(<CookieTable cookies={cookies} />);

    expect(screen.getByText("session_id")).toBeInTheDocument();
    expect(screen.getByText("abc123")).toBeInTheDocument();
    expect(screen.getAllByText("example.com")).toHaveLength(2);
    expect(screen.getByText("/")).toBeInTheDocument();
    expect(screen.getByText(cookies[0].expires.toString())).toBeInTheDocument();
    expect(screen.getAllByText("true")).toHaveLength(2);
    expect(screen.getByText("Lax")).toBeInTheDocument();

    expect(screen.getByText("analytics")).toBeInTheDocument();
    expect(screen.getByText("enabled")).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(3);
  });

  it("test to see if an empty cell is rendered for undefined cookie values", () => {
    const cookies: Cookie[] = [
      {
        name: "partial",
        value: "value",
      },
    ];

    render(<CookieTable cookies={cookies} />);

    expect(screen.getByText("partial")).toBeInTheDocument();
    expect(screen.getByText("value")).toBeInTheDocument();
    const cells = screen.getAllByRole("cell");
    expect(cells).toHaveLength(8);
  });
});
