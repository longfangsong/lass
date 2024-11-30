"use client";
import { useWindowSize } from "@uidotdev/usehooks";
import { Button } from "flowbite-react";
import { FaGithub } from "react-icons/fa";
import { HiOutlineArrowDown } from "react-icons/hi";

export const runtime = "edge";

export default function Home() {
  const { height } = useWindowSize();
  return (
    <>
      <div className="h-full flex flex-col place-content-between items-center">
        <div>
          <h1
            className={
              "text-8xl font-bold norse-bold text-center " +
              (height! > 720 ? "mt-16" : "mt-4")
            }
          >
            Läss
          </h1>
          <h2 className="text-4xl font-bold text-center mt-4">
            A platform for learning Svenska
          </h2>
          <div
            className={
              "columns-1 md:columns-3 " + (height! > 720 ? "mt-16" : "mt-4")
            }
          >
            <Button href="/articles" className="mx-auto my-4 md:my-0 w-fit">
              Read Articles
            </Button>
            <Button href="/words" className="mx-auto my-4 md:my-0 w-fit">
              Dictionary
            </Button>
            <Button href="/word_book" className="mx-auto my-4 md:my-0 w-fit">
              Review Words
            </Button>
          </div>
        </div>
        <Button
          className="mb-20"
          outline
          pill
          onClick={() => {
            document.getElementById("donate")!.scrollIntoView({
              behavior: "smooth",
              block: "end",
              inline: "nearest",
            });
          }}
        >
          <HiOutlineArrowDown className="h-6 w-6" />
        </Button>
      </div>
      <div id="donate" className="h-full">
        <h2 className="text-4xl font-bold text-center mt-4 mb-8">
          Support developer
        </h2>
        <p className="text-center">
          The site is deployed on{" "}
          <a className="text-sky-400" href="https://pages.cloudflare.com/">
            Cloudflare Pages
          </a>
          .
          <br /> There is no hosting fee, so this site is totally free for use.
        </p>
        <p className="text-center">
          But the developer takes time and effort to maintain the site.
        </p>
        <p className="text-center">
          If you like the site, please consider donating to the developer.
        </p>
        <p className="text-center">
          Have an idea about the site? Please create issues or pull requests.
        </p>
        <div className="flex flex-row gap-6 md:gap-12 justify-center mt-4">
          <div className="flex flex-col justify-center justify-items-center">
            <img
              className="w-32 mx-auto"
              src="/swish.jpeg"
              alt="Donate via Swish"
            />
            <p className="text-xs text-center">Donate via Swish</p>
          </div>
          <div className="flex flex-col justify-center justify-items-center">
            <a className="mx-auto" href="https://github.com/longfangsong/lass">
              <FaGithub className="h-20 w-20 md:h-32 md:w-32" />
            </a>
            <p className="text-xs text-center">Contribute on GitHub</p>
          </div>
          <div className="flex flex-col justify-center justify-items-center">
            <img
              className="w-32 mx-auto"
              src="/buymeacoffee.png"
              alt="Donate via Buy Me A Coffee"
            />
            <p className="text-xs text-center">Donate via Buy Me A Coffee</p>
          </div>
        </div>
      </div>
    </>
  );
}
