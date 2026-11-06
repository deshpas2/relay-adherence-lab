import { SignInForm } from "@/components/auth/sign-in-form";

// TODO(lane-be merge): pass linkAction={sendMagicLink} passwordAction={signInWithPassword}
export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const { error } = await searchParams;
  return <SignInForm urlError={typeof error === "string" ? error : undefined} />;
}
