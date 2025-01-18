import { localFirstDataSource } from "@/lib/frontend/datasource/localFirst";
import { Button } from "flowbite-react";

export default function SignOutButton() {
  return (
    <Button
      onClick={async () => {
        await localFirstDataSource.clearReviewProgress();
        window.location.href = "/api/auth/logout";
      }}
    >
      Sign Out
    </Button>
  );
}
