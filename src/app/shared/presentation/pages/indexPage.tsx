import { Link } from "react-router";
import { Button } from "@app/shared/presentation/components/ui/button";
import { ArrowDown } from "lucide-react";
import { cn } from "@app/shared/presentation/lib/utils";
import swish from "@app/shared/presentation/assets/swish.jpeg";
import buymeacoffee from "@app/shared/presentation/assets/buymeacoffee.png";
import useWindowDimensions from "../hooks/useWindowDimensions";

export default function Index() {
  const { height } = useWindowDimensions();
  return (
    <>
      <div className="h-full flex flex-col place-content-between items-center">
        <div>
          <h1
            className={cn(
              "text-8xl font-bold norse-bold text-center",
              height! > 720 ? "mt-16" : "mt-4",
            )}
          >
            Läss
          </h1>
          <h2 className="text-4xl font-bold text-center mt-4">
            A platform for learning Svenska
          </h2>
          <div
            className={cn(
              "grid grid-cols-1 sm:grid-cols-3 gap-4",
              height! > 720 ? "mt-16" : "mt-4",
            )}
          >
            <Button asChild className="w-[160px] mx-auto">
              <Link to="/articles">Articles</Link>
            </Button>
            <Button asChild className="w-[160px] mx-auto">
              <Link to="/dictionary">Dictionary</Link>
            </Button>
            <Button asChild className="w-[160px] mx-auto">
              <Link to="/wordbook/review">Review Words</Link>
            </Button>
          </div>
        </div>
        <Button
          className="mb-20"
          variant="outline"
          size="lg"
          onClick={() => {
            document.getElementById("donate")!.scrollIntoView({
              behavior: "smooth",
              block: "end",
              inline: "nearest",
            });
          }}
        >
          <ArrowDown />
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
              width={128}
              height={128}
              className="mx-auto"
              src={swish}
              alt="Donate via Swish"
            />
            <p className="text-xs text-center">Donate via Swish</p>
          </div>
          <div className="flex flex-col justify-center justify-items-center">
            <a className="mx-auto" href="https://github.com/longfangsong/lass">
              <svg
                role="img"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                className="w-32 dark:invert"
              >
                <title>GitHub</title>
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
            </a>
            <p className="text-xs text-center">Contribute on GitHub</p>
          </div>
          <div className="flex flex-col justify-center justify-items-center">
            <img
              width={128}
              height={128}
              className="mx-auto"
              src={buymeacoffee}
              alt="Donate via Buy Me A Coffee"
            />
            <p className="text-xs text-center">Donate via Buy Me A Coffee</p>
          </div>
        </div>
      </div>
    </>
  );
}
