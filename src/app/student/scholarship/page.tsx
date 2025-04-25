"use client";

import { Card } from "@/components/ui/card";
import SidebarMahasiswa from "@/app/components/layout/sidebarmahasiswa";
import { useEffect, useState } from "react";
import { Toaster, toast } from "sonner";

interface Period {
  period_id: number;
  period: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  is_open: boolean;
  is_registered?: boolean;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function Upload() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);

      const periodsResponse = await fetch("/api/periods");
      const periodsData: Period[] = await periodsResponse.json();

      const updatedPeriods = await Promise.all(
        periodsData.map(async (period) => {
          const response = await fetch("/api/status/check-registration", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ period_id: period.period_id }),
          });

          if (!response.ok) {
            throw new Error("Failed to check registration status.");
          }

          const result = await response.json();
          return { ...period, is_registered: result.exists }; 
        })
      );

      setPeriods(updatedPeriods);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Gagal memuat data periode.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRegister = async (periodId: number) => {
    try {
      setLoading(true);

      const response = await fetch("/api/status/new", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ period_id: periodId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to register.");
      }

      toast.success("Pendaftaran berhasil!");
      fetchData();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Pendaftaran mengalami error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Toaster position="bottom-right" richColors />
      <div className="w-1/4 m-8">
        <SidebarMahasiswa activeTab="scholarship" />
      </div>

      <div className="my-8 mr-8 w-full">
        <h1 className="text-2xl font-bold mb-6">Beasiswa</h1>

        <Card className="p-8 w-full">
          {loading ? (
            <p className="text-lg">Loading...</p>
          ) : (
            <>
              {periods.map((p: Period) => (
                <div
                  key={p.period_id}
                  className="bg-white p-6 rounded shadow mb-3 w-full flex items-center justify-between"
                >
                  <div>
                    <h2 className="font-bold text-xl">{p.period}</h2>
                    <p>
                      {formatDate(p.start_date)} - {formatDate(p.end_date)}
                    </p>
                  </div>
                  {p.is_registered ? (
                    <p>Anda telah mendaftar.</p>
                  ) : p.is_open ? (
                    <button
                      className="bg-[#003793] text-white px-6 py-2 rounded-md hover:bg-[#b5c3e1]"
                      onClick={() => handleRegister(p.period_id)}
                    >
                      Daftar
                    </button>
                  ) : (
                    <p>Pendaftaran tidak dibuka.</p>
                  )}
                </div>
              ))}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}