import {
  Calendar, Clock, IndianRupee, Percent, Users, MapPin, FileCheck2,
  Phone, ListChecks, AlertTriangle, Building2, User, Info,
} from "lucide-react";
import { EmptyState } from "../ui/primitives";
import { Search } from "lucide-react";

const ICONS = {
  Person: User, Organization: Building2, Date: Calendar, Deadline: Clock,
  Amount: IndianRupee, Percentage: Percent, Eligibility: Users, Location: MapPin,
  Requirement: FileCheck2, Contact: Phone, Procedure: ListChecks, Warning: AlertTriangle,
  Other: Info,
};

export default function FactsPanel({ facts }) {
  if (!facts || facts.length === 0) {
    return (
      <EmptyState
        icon={Search}
        title="No facts extracted yet"
        description="Run the analysis to extract the important facts from this document."
      />
    );
  }
  return (
    <div>
      <p className="mb-4 text-sm text-ink-muted">
        {facts.length} important fact{facts.length !== 1 ? "s" : ""} found in the original document.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {facts.map((f) => {
          const Icon = ICONS[f.category] || Info;
          return (
            <div key={f.id} className="card p-4">
              <div className="flex items-center gap-2 text-brand-700">
                <Icon size={18} aria-hidden="true" />
                <span className="text-xs font-bold uppercase tracking-wide">{f.category}</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-ink">{f.label}</p>
              <p className="mt-1 text-sm text-ink-soft">{f.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
