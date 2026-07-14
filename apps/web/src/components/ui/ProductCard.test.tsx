import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { fallbackData } from "@/lib/fallbackData";
import { ProductCard } from "./ProductCard";

describe("ProductCard", () => {
  it("renders product title and VND price", () => {
    render(<ProductCard product={fallbackData.products[0]} />);
    expect(screen.getByText("Auto Reup Master")).toBeInTheDocument();
    expect(screen.getByText(/1\.290\.000/)).toBeInTheDocument();
  });
});
