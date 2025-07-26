import type { MDXComponents } from "@types/mdx";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
  };
}
