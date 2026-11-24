import AuthScreen from "@/app/auth/auth-screen";

type RegisterPageProps = {
  searchParams: Promise<{ accountType?: string | string[] }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { accountType } = await searchParams;
  const requestedAccountType = Array.isArray(accountType)
    ? accountType[0]
    : accountType;

  return (
    <AuthScreen
      mode="register"
      accountType={requestedAccountType === "owner" ? "owner" : "customer"}
    />
  );
}
