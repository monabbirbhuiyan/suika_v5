"use client";

import { User } from "@/generated/prisma";
import {
  CreditCard,
  Check,
  X,
  ArrowRight,
  Calendar,
  Download,
  Lock,
  Zap,
} from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { plans } from "@/lib/constant";

type Props = {
  user: User;
  onSave: (section: string) => Promise<void>;
};

const BILLING_HISTORY = [
  {
    id: "inv_001",
    date: "2026-04-08",
    description: "Student Tier Monthly",
    amount: "$9.99",
    status: "Paid",
  },
  {
    id: "inv_002",
    date: "2026-03-08",
    description: "Student Tier Monthly",
    amount: "$9.99",
    status: "Paid",
  },
  {
    id: "inv_003",
    date: "2026-02-08",
    description: "Student Tier Monthly",
    amount: "$9.99",
    status: "Paid",
  },
];

const BillingTab = ({ user }: Props) => {
  const currentPlan = "Free Tier";
  const nextBillingDate = new Date(2026, 5, 8).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-4">
      {/* Current Plan */}
      <div className="rounded-xl border border-(--brand-green)/15 bg-white p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-(--brand-green)/10">
            <Zap className="h-4 w-4 text-brand-green" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-brand-ink">
              Current plan
            </h3>
            <p className="text-xs text-[#5f7a70] mt-0.5">
              You're on the {currentPlan}. Upgrade anytime.
            </p>
          </div>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-3xl font-bold text-brand-green">{currentPlan}</p>
            <p className="text-sm text-[#5f7a70] mt-1">Free forever</p>
          </div>
          <Button className="bg-brand-green hover:bg-brand-green-700 text-white">
            View all plans
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {currentPlan !== "Free Tier" && (
          <div className="mt-4 pt-4 border-t border-(--brand-green)/10">
            <p className="text-xs text-[#5f7a70]">
              Next billing date:{" "}
              <span className="font-medium text-brand-ink">
                {nextBillingDate}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Plan Comparison */}
      <div className="rounded-xl border border-(--brand-green)/15 bg-white p-5">
        <div className="flex items-start gap-3 mb-5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-(--brand-green)/10">
            <CreditCard className="h-4 w-4 text-brand-green" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-brand-ink">
              Pricing plans
            </h3>
            <p className="text-xs text-[#5f7a70] mt-0.5">
              Choose the plan that fits your legal work.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-lg border p-4 flex flex-col relative ${
                plan.highlighted
                  ? "border-brand-red bg-brand-red/5 ring-1 ring-brand-red/20"
                  : currentPlan === plan.name
                    ? "border-brand-green bg-(--brand-green)/8"
                    : "border-(--brand-green)/15 bg-white hover:border-(--brand-green)/40"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-4">
                  <span className="inline-block px-2 py-1 rounded-full bg-brand-red text-white text-xs font-medium">
                    Most popular
                  </span>
                </div>
              )}

              <div className={`mb-4 ${plan.highlighted ? "pt-2" : ""}`}>
                <h4 className="text-sm font-semibold text-brand-ink">
                  {plan.name}
                </h4>
                <p className="text-xs text-[#5f7a70] mt-0.5">
                  {plan.description}
                </p>
              </div>

              <div className="mb-4">
                <p className="text-2xl font-bold text-brand-ink">
                  {plan.price}
                </p>
                <p className="text-xs text-[#5f7a70]">{plan.period}</p>
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-brand-green shrink-0 mt-0.5" />
                    <span className="text-xs text-brand-ink">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={currentPlan === plan.name ? "outline" : "default"}
                disabled={currentPlan === plan.name}
                className={
                  currentPlan === plan.name
                    ? "w-full border-(--brand-green)/25 text-brand-green"
                    : "w-full bg-brand-green hover:bg-brand-green-700 text-white"
                }
              >
                {currentPlan === plan.name ? "Current Plan" : plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Billing History */}
      <div className="rounded-xl border border-(--brand-green)/15 bg-white p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-(--brand-green)/10">
            <Calendar className="h-4 w-4 text-brand-green" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-brand-ink">
              Billing history
            </h3>
            <p className="text-xs text-[#5f7a70] mt-0.5">
              View and download your invoices.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-(--brand-green)/10">
                <th className="text-left py-2 px-3 text-xs font-medium text-[#5f7a70]">
                  Date
                </th>
                <th className="text-left py-2 px-3 text-xs font-medium text-[#5f7a70]">
                  Description
                </th>
                <th className="text-right py-2 px-3 text-xs font-medium text-[#5f7a70]">
                  Amount
                </th>
                <th className="text-center py-2 px-3 text-xs font-medium text-[#5f7a70]">
                  Status
                </th>
                <th className="text-center py-2 px-3 text-xs font-medium text-[#5f7a70]">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {BILLING_HISTORY.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="border-b border-(--brand-green)/10 last:border-0 hover:bg-brand-green/5"
                >
                  <td className="py-3 px-3 text-brand-ink">{invoice.date}</td>
                  <td className="py-3 px-3 text-brand-ink">
                    {invoice.description}
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-brand-ink">
                    {invoice.amount}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {invoice.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      type="button"
                      className="text-brand-green hover:text-brand-green-700 transition-colors"
                      title="Download invoice"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Method */}
      <div className="rounded-xl border border-(--brand-green)/15 bg-white p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-(--brand-green)/10">
            <Lock className="h-4 w-4 text-brand-green" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-brand-ink">
              Payment method
            </h3>
            <p className="text-xs text-[#5f7a70] mt-0.5">
              Manage your payment information securely.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border border-(--brand-green)/15 bg-white">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-[#5f7a70]" />
            <div>
              <p className="text-sm font-medium text-brand-ink">
                Visa ending in 4242
              </p>
              <p className="text-xs text-[#5f7a70]">Expires 12/26</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="border-(--brand-green)/25 text-brand-green hover:bg-brand-green-100/30"
          >
            Update
          </Button>
        </div>

        <p className="text-xs text-[#5f7a70] mt-4">
          Payments are secured and processed through Stripe. We never store your
          full card details.
        </p>
      </div>
    </div>
  );
};

export default BillingTab;
