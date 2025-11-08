"use client";

import Image from "next/image";
import { useMyFetch } from "~/helpers/customHooks";
import { AffiliateLinkType } from "~/helpers/types";

const height = 192 / 2;
const width = 1920 / 2;
const className = "d-flex justify-content-center w-100 max-w-100 mb-3";
const style = { overflow: "clip", backgroundColor: "#151515" };

type Props = {
  type: AffiliateLinkType;
};

function AffiliateLink({ type }: Props) {
  const myFetch = useMyFetch();

  const logAffiliateLinkClick = async () => {
    await myFetch.get(`/log-affiliate-link-click/${type}`);
  };

  switch (type) {
    case "3x3":
      return (
        <a
          href="https://cuboss.com/product-category/3x3-speedcubes"
          target="_blank"
          onClick={() => logAffiliateLinkClick()}
          className={className}
          style={style}
        >
          <Image src="/banners/3x3.jpg" height={height} width={width} alt="Cuboss ad for 3x3x3 puzzles" />
        </a>
      );
    case "2x2":
      return (
        <a
          href="https://cuboss.com/product-category/2x2-speedcubes"
          target="_blank"
          onClick={() => logAffiliateLinkClick()}
          className={className}
          style={style}
        >
          <Image src="/banners/2x2.jpg" height={height} width={width} alt="Cuboss ad for 2x2x2 puzzles" />
        </a>
      );
    case "wca":
      return (
        <a
          // href="https://cuboss.com/product-category/wca-puzzles?r=cubingcontests&utm_source=cubingcontests&utm_campaign=FTO"
          href="https://cuboss.com/product-category/wca-puzzles"
          target="_blank"
          onClick={() => logAffiliateLinkClick()}
          className={className}
          style={style}
        >
          <Image src="/banners/wca.jpg" height={height} width={width} alt="Cuboss ad for WCA puzzles" />
        </a>
      );
    case "fto":
      return (
        <a
          // href="https://cuboss.com/?s=fto&post_type=product&r=cubingcontests&utm_source=cubingcontests&utm_campaign=FTO"
          href="https://cuboss.com/?s=fto&post_type=product"
          target="_blank"
          onClick={() => logAffiliateLinkClick()}
          className={className}
          style={style}
        >
          <Image src="/banners/fto.jpg" height={height} width={width} alt="Cuboss ad for FTO puzzles" />
        </a>
      );
    case "mirror":
      return (
        <a
          href="https://cuboss.com/?s=mirror&post_type=product"
          target="_blank"
          onClick={() => logAffiliateLinkClick()}
          className={className}
          style={style}
        >
          <Image src="/banners/mirror.jpg" height={height} width={width} alt="Cuboss ad for Mirror Blocks puzzles" />
        </a>
      );
    case "kilominx":
      return (
        <a
          href="https://cuboss.com/?s=kilominx&post_type=product"
          target="_blank"
          onClick={() => logAffiliateLinkClick()}
          className={className}
          style={style}
        >
          <Image src="/banners/kilominx.jpg" height={height} width={width} alt="Cuboss ad for Kilominx puzzles" />
        </a>
      );
    case "other":
      return (
        <a
          // href="https://cuboss.com/?utm_source=cubingcontests"
          href="https://cuboss.com/"
          target="_blank"
          onClick={() => logAffiliateLinkClick()}
          className={className}
          style={style}
        >
          <Image src="/banners/other.jpg" height={height} width={width} alt="Cuboss ad" />
        </a>
      );
    default:
      return;
  }
}

export default AffiliateLink;
