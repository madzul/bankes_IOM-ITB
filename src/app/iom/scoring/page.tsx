"use client";
import SidebarIOM from "@/app/components/layout/sidebariom";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";

export default function Scoring() {

  const [loading, setLoading] = useState(false);

  return (
      <div className="flex min-h-screen bg-gray-100">
        <div className="w-1/4 m-8">
          <SidebarIOM activeTab="scoring" />
        </div>
        <div className="my-8 mr-8 w-full">
          <h1 className="text-2xl font-bold mb-6">Penilaian Mahasiswa</h1>
          <Card className="p-8 w-[70dvw]">
            {loading ? (
                <p className="text-lg">Loading...</p>
            ) : (
                <>
                  <select
                    className="block w-[300px] px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value=""
                  >
                    <option value="">Pilih Periode</option>
                    <option value="Periode 1">Periode 1</option>
                  </select>

                  <div className="flex w-full gap-6 justify-between mt-6">
                    <div className="w-[500px] max-w-full border border-gray-300 rounded-md">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              scope="col"
                              className="px-2 py-4 text-left text-xs font-medium uppercase tracking-wider"
                            >
                              NIM
                            </th>
                            <th
                              scope="col"
                              className="px-2 py-4 text-left text-xs font-medium uppercase tracking-wider"
                            >
                              Nama
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          <tr>
                            <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-900">13522099</td>
                            <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-900">Julian Caleb Simandjuntak</td>
                          </tr>
                          <tr>
                            <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-900">13522119</td>
                            <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-900">Indraswara Galih Jayanegara</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="w-full h-full border border-gray-300 rounded-md p-4">
                      <p className="mb-2">Apakah mahasiswa mempunyai prestasi yang baik?</p>
                      <div className="flex justify-between items-center">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="prestasi"
                            value="kurang"
                            className="mr-2"
                            defaultChecked
                          />
                          <span>Kurang</span>
                        </label>

                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="prestasi"
                            value="cukup"
                            className="mr-2"
                          />
                          <span>Cukup</span>
                        </label>

                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="prestasi"
                            value="baik"
                            className="mr-2"
                          />
                          <span>Baik</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </>
            )}
          </Card>
        </div>
      </div>
  )
}