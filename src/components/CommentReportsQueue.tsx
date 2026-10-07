"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import type { CommentReport } from "@/utils/blogService";

function getReporterName(report: CommentReport) {
  return report.reporter?.display_name || report.reporter?.username || "FilmShift member";
}

export default function CommentReportsQueue({
  initialReports,
  adminId,
}: {
  initialReports: CommentReport[];
  adminId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [reports, setReports] = useState(initialReports);
  const [errorMessage, setErrorMessage] = useState("");
  const [busyReportId, setBusyReportId] = useState<string | null>(null);

  async function resolveReport(report: CommentReport, removeComment: boolean) {
    setBusyReportId(report.id);
    setErrorMessage("");

    if (removeComment && report.comment_id) {
      const { error } = await supabase
        .from("comments")
        .update({ is_removed: true })
        .eq("id", report.comment_id);
      if (error) {
        setErrorMessage(error.message);
        setBusyReportId(null);
        return;
      }
    }

    const { error } = await supabase
      .from("comment_reports")
      .update({ resolved_at: new Date().toISOString(), resolved_by: adminId })
      .eq("id", report.id);
    if (error) {
      setErrorMessage(error.message);
    } else {
      setReports((existing) => existing.filter((item) => item.id !== report.id));
      router.refresh();
    }
    setBusyReportId(null);
  }

  return (
    <section className="mt-10 rounded-3xl border border-text-muted/15 bg-surface p-6 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black">Comment reports</h2>
          <p className="mt-1 text-sm text-text-muted">Review reports and remove comments that violate community rules.</p>
        </div>
        <span className="rounded-full bg-background px-3 py-1 text-xs font-bold">{reports.length} open</span>
      </div>

      {errorMessage && <p role="alert" className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-200">{errorMessage}</p>}

      {reports.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-text-muted/20 p-6 text-center text-sm text-text-muted">There are no open comment reports.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {reports.map((report) => (
            <li key={report.id} className="rounded-2xl border border-text-muted/15 bg-background p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <p className="font-bold uppercase tracking-wider text-accent">{report.reason.replace("-", " ")}</p>
                <p className="text-text-muted">
                  Reported by {getReporterName(report)} · {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(report.created_at))}
                </p>
              </div>
              <blockquote className="mt-4 whitespace-pre-wrap break-words border-l-2 border-text-muted/20 pl-4 text-sm leading-6">
                {report.reported_comment_body}
              </blockquote>
              {report.details && <p className="mt-3 text-sm text-text-muted">Report details: {report.details}</p>}
              {report.post && (
                <Link href={`/blog/${report.post.slug}`} className="mt-3 inline-block text-xs font-semibold text-accent hover:underline">
                  View “{report.post.title}”
                </Link>
              )}
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => void resolveReport(report, false)}
                  disabled={busyReportId === report.id}
                  className="rounded-lg border border-text-muted/20 px-3 py-2 text-xs font-semibold text-text-muted hover:text-foreground disabled:opacity-50"
                >
                  Dismiss report
                </button>
                <button
                  type="button"
                  onClick={() => void resolveReport(report, true)}
                  disabled={busyReportId === report.id || !report.comment_id}
                  className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-50"
                >
                  {busyReportId === report.id ? "Processing..." : "Remove comment"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
