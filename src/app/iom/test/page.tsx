'use client';
import { useState, useEffect } from 'react';

export default function FinancialAidFormPage() {
  const [transportMethods, setTransportMethods] = useState<string[]>([]);
  const [otherTransportValue, setOtherTransportValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [formId, setFormId] = useState<string | null>(null); // For editing existing form
  const options = ["Jalan kaki", "Sepeda", "Ojeg online", "Angkot/bus"];

  const [form, setForm] = useState({
    coversFood: false,
    coversRent: false,
    coversTransport: false,
    coversEducationNeeds: false,
    coversHealth: false,
    receivesScholarship: '',
    otherScholarshipAnswer: '',
    scholarshipAmount: '',
    previousIOMAid: '',
  });

  // Load form data from database
  const loadFormData = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/financial-aid/${id}`);
      if (response.ok) {
        const data = await response.json();
        const parsedFormData = JSON.parse(data.formData);
        
        // Populate form state
        setForm(parsedFormData.form);
        setTransportMethods(parsedFormData.transportMethods || []);
        
        // Handle "Other" transport method
        const otherTransport = parsedFormData.transportMethods?.find((method: string) => 
          !options.includes(method)
        );
        if (otherTransport) {
          setTransportMethods(prev => [...prev.filter(m => options.includes(m)), "Other"]);
          setOtherTransportValue(otherTransport);
        }
        
        setFormId(id);
      } else {
        alert('Failed to load form data');
      }
    } catch (error) {
      console.error('Error loading form:', error);
      alert('Error loading form data');
    } finally {
      setLoading(false);
    }
  };

  // Load form data on component mount if formId is provided (e.g., from URL params)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) {
      loadFormData(id);
    }
  }, []);

  const handleCheckboxChange = (field: keyof typeof form) => {
    setForm(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Prepare transport methods data
      const finalTransportMethods = [
        ...transportMethods.filter((v) => v !== "Other"),
        ...(transportMethods.includes("Other") && otherTransportValue ? [otherTransportValue] : []),
      ];

      // Prepare scholarship answer
      let scholarshipAnswer = form.receivesScholarship;
      if (form.receivesScholarship === 'other' && form.otherScholarshipAnswer) {
        scholarshipAnswer = form.otherScholarshipAnswer;
      }

      const formData = {
        form: {
          ...form,
          receivesScholarship: scholarshipAnswer,
        },
        transportMethods: finalTransportMethods,
        submittedAt: new Date().toISOString(),
      };

      // Convert to JSON string for database storage
      const jsonString = JSON.stringify(formData);

      // Save to database
      const url = formId ? `/api/financial-aid/${formId}` : '/api/financial-aid';
      const method = formId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formData: jsonString,
          // Add any additional fields like userId, etc.
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Form saved successfully:', result);
        alert(formId ? 'Form updated successfully!' : 'Form submitted successfully!');
        
        // If it's a new form, set the ID for future updates
        if (!formId && result.id) {
          setFormId(result.id);
          // Optionally update URL to include the ID
          window.history.replaceState({}, '', `?id=${result.id}`);
        }
      } else {
        throw new Error('Failed to save form');
      }
    } catch (error) {
      console.error('Error saving form:', error);
      alert('Error saving form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-xl mx-auto">
      {loading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      )}
      
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Enter Form ID to load"
          className="border p-2 rounded flex-1"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              const target = e.target as HTMLInputElement;
              if (target.value.trim()) {
                loadFormData(target.value.trim());
              }
            }
          }}
        />
        <button
          onClick={() => {
            const input = document.querySelector('input[placeholder="Enter Form ID to load"]') as HTMLInputElement;
            if (input?.value.trim()) {
              loadFormData(input.value.trim());
            }
          }}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          disabled={loading}
        >
          Load
        </button>
      </div>
      <div className="border p-4 rounded">
        <h3 className="font-semibold mb-4">Kiriman orangtua mencakup untuk apa saja?</h3>
        {[
          ['coversFood', 'Makan sehari hari'],
          ['coversRent', 'Kost / sewa kamar'],
          ['coversTransport', 'Transportasi ke kampus / bensin'],
          ['coversEducationNeeds', 'Kebutuhan perkuliahan (alat tulis, ongkos kerja kelompok dll)'],
          ['coversHealth', 'Biaya kesehatan (ke dr, beli obat) bila sakit'],
        ].map(([key, label]) => (
          <div key={key} className="mb-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={form[key as keyof typeof form] as boolean}
                onChange={() => handleCheckboxChange(key as keyof typeof form)}
                className="form-checkbox"
              />
              <span>{label}</span>
            </label>
          </div>
        ))}
      </div>

      <div className="border p-4 rounded">
        <h3 className="font-semibold mb-4">Apakah mendapat beasiswa semester ini?</h3>
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="scholarship"
              value="yes"
              checked={form.receivesScholarship === 'yes'}
              onChange={() => setForm(prev => ({ ...prev, receivesScholarship: 'yes' }))}
            />
            <span>Ya</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="scholarship"
              value="no"
              checked={form.receivesScholarship === 'no'}
              onChange={() => setForm(prev => ({ ...prev, receivesScholarship: 'no' }))}
            />
            <span>Tidak</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="scholarship"
              value="other"
              checked={form.receivesScholarship === 'other'}
              onChange={() => setForm(prev => ({ ...prev, receivesScholarship: 'other' }))}
            />
            <span>Lainnya:</span>
          </label>

          {form.receivesScholarship === 'other' && (
            <input
              type="text"
              className="ml-6 border rounded p-2 w-full"
              placeholder="Tulis jawaban lain..."
              value={form.otherScholarshipAnswer}
              onChange={(e) => setForm(prev => ({ ...prev, otherScholarshipAnswer: e.target.value }))}
            />
          )}
        </div>
      </div>

      {form.receivesScholarship === 'yes' && (
        <div>
          <label className="block font-medium mb-2">Apabila iya, berapa besarannya dan sumber pemberi beasiswa</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            value={form.scholarshipAmount}
            onChange={e => setForm(prev => ({ ...prev, scholarshipAmount: e.target.value }))}
            placeholder="Contoh: 2 juta / semester dari KIP-K"
          />
        </div>
      )}

      <div>
        <label className="block font-medium mb-2">Bantuan yang pernah didapatkan dari IOM ITB</label>
        <input
          type="text"
          className="w-full border p-2 rounded"
          value={form.previousIOMAid}
          onChange={e => setForm(prev => ({ ...prev, previousIOMAid: e.target.value }))}
          placeholder="Contoh: Bantuan laptop tahun 2022"
        />
      </div>

      <div className="space-y-2">
        <p className="font-medium">Pergi ke kampus menggunakan apa</p>

        {options.map((option) => (
          <label key={option} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={transportMethods.includes(option)}
              onChange={(e) => {
                if (e.target.checked) {
                  setTransportMethods([...transportMethods, option]);
                } else {
                  setTransportMethods(transportMethods.filter((v) => v !== option));
                }
              }}
              className="accent-purple-600"
            />
            <span>{option}</span>
          </label>
        ))}

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={transportMethods.includes("Other")}
            onChange={(e) => {
              if (e.target.checked) {
                setTransportMethods([...transportMethods, "Other"]);
              } else {
                setTransportMethods(transportMethods.filter((v) => v !== "Other"));
                setOtherTransportValue("");
              }
            }}
            className="accent-purple-600"
          />
          <span>Other:</span>
          <input
            type="text"
            value={otherTransportValue}
            onChange={(e) => setOtherTransportValue(e.target.value)}
            disabled={!transportMethods.includes("Other")}
            className="border-b border-purple-500 outline-none disabled:opacity-50"
            placeholder="Isi jawaban lain"
          />
        </label>
      </div>

      <button 
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? 'Saving...' : (formId ? 'Update Form' : 'Submit Form')}
      </button>
    </div>
  );
}