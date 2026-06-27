import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PrivacyPolicy } from "../pages/PrivacyPolicy";
import { TermsOfService } from "../pages/TermsOfService";
import { MemoryRouter } from "react-router-dom";
import React from "react";

describe("Legal Pages", () => {
  it("renders PrivacyPolicy", () => {
    const { container } = render(
      <MemoryRouter>
        <PrivacyPolicy />
      </MemoryRouter>
    );
    expect(container.textContent).toContain("Política de Privacidade");
  });

  it("renders TermsOfService", () => {
    const { container } = render(
      <MemoryRouter>
        <TermsOfService />
      </MemoryRouter>
    );
    expect(container.textContent).toContain("Termos de Serviço");
  });
});
