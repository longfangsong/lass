"use client";
import "./norse-bold.css";
import { Button } from "flowbite-react";
import { HiOutlineArrowDown } from "react-icons/hi";
export default function Home() {
  return (
    <>
      <div className="h-full flex flex-col place-content-between items-center">
        <div>
          <h1 className="text-8xl font-bold norse-bold text-center mt-16">
            Läss
          </h1>
          <h2 className="text-4xl font-bold text-center mt-4">
            A platform for learning Svenska
          </h2>
          <div className="mt-16 columns-1 md:columns-3">
            <Button
              href={process.env.CF_PAGES_URL + "/articles"}
              className="mx-auto my-4 md:my-0 w-fit"
            >
              Read Articles
            </Button>
            <Button
              href={process.env.CF_PAGES_URL + "/words"}
              className="mx-auto my-4 md:my-0 w-fit"
            >
              Dictionary
            </Button>
            <Button
              href={process.env.CF_PAGES_URL + "/word_book"}
              className="mx-auto my-4 md:my-0 w-fit"
            >
              Review Words
            </Button>
          </div>
        </div>
        <Button
          className="mb-8"
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
        <h2 className="text-4xl font-bold text-center mt-4 mb-8">Donate.</h2>
      </div>
    </>
  );
}
