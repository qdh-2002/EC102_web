import { Fragment } from "react";
import { instructorList } from "@/lib/terms";

/** Instructor names joined by commas; names with a profile link open it in a new tab. */
export function InstructorLinks({ instructors, className = "underline-offset-2 hover:underline" }: { instructors: string; className?: string }) {
  return (
    <>
      {instructorList(instructors).map((s, i) => (
        <Fragment key={s.name}>
          {i > 0 && ", "}
          {s.url ? (
            <a href={s.url} target="_blank" rel="noopener noreferrer" className={className}>
              {s.name}
              <span className="sr-only"> (profile, opens in a new tab)</span>
            </a>
          ) : (
            s.name
          )}
        </Fragment>
      ))}
    </>
  );
}
