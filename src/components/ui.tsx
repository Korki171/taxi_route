import { statusTone } from "@/lib/labels";

export function Badge({ status, children }: { status: string; children: React.ReactNode }) {
  return <span className={`badge ${statusTone(status)}`}>{children}</span>;
}

export function Flash({ searchParams }: { searchParams: { error?: string; ok?: string } }) {
  return (
    <>
      {searchParams.error && <div className="flash error" role="alert">{searchParams.error}</div>}
      {searchParams.ok && <div className="flash ok" role="status">{searchParams.ok}</div>}
    </>
  );
}

export type SP = Promise<{ error?: string; ok?: string; [k: string]: string | undefined }>;
