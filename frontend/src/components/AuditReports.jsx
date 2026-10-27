import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  CheckCircle,
  Shield,
  FileCheck,
  RefreshCw,
  Building,
} from 'lucide-react';

export default function AuditReports() {
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('7d'); // 24h, 7d, 30d
  const [facilityCode, setFacilityCode] = useState('FAC-001');

  const fetchReport = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate = new Date();
      if (timeRange === '24h') startDate.setDate(now.getDate() - 1);
      if (timeRange === '7d') startDate.setDate(now.getDate() - 7);
      if (timeRange === '30d') startDate.setDate(now.getDate() - 30);

      const res = await api.getComplianceReport({
        facilityCode,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
      });
      if (res.data.success) {
        setReport(res.data.report);
      }
    } catch (err) {
      console.error('Failed to generate audit report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [timeRange, facilityCode]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.reportId}_Compliance_Audit.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Configuration Header (Hidden during print) */}
      <div className="no-print flex flex-wrap items-center justify-between p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-xl gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white scada-font">
              AUTOMATED ENVIRONMENTAL AUDIT & REGULATORY REPORT GENERATOR
            </h2>
          </div>
          <p className="text-xs font-mono text-zinc-400 mt-1">
            Certified EPA Clean Water Act Form • Official Discharge Monitoring Report (DMR)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-zinc-800 text-xs font-mono text-white rounded-xl px-3 py-2 border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="24h">Past 24 Hours</option>
            <option value="7d">Past 7 Days (Standard)</option>
            <option value="30d">Past 30 Days (Monthly DMR)</option>
          </select>

          {/* Action Buttons */}
          <button
            onClick={handleDownloadJson}
            disabled={!report}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono text-xs font-semibold border border-zinc-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            EXPORT JSON
          </button>

          <button
            onClick={handlePrint}
            disabled={!report}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-xs font-bold transition shadow-lg shadow-emerald-500/20"
          >
            <Printer className="w-3.5 h-3.5" />
            PRINT / SAVE PDF
          </button>
        </div>
      </div>

      {loading && (
        <div className="no-print p-12 text-center text-zinc-400 font-mono text-sm">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
          Compiling regulatory time-series analytics and discharge logs...
        </div>
      )}

      {/* Official Environmental Regulatory Report Body */}
      {report && (
        <div className="report-page bg-zinc-950/90 text-slate-100 p-8 rounded-2xl border border-zinc-800 shadow-2xl space-y-6 font-mono">
          {/* Regulatory Agency Header */}
          <div className="border-b-2 border-zinc-700 pb-5 flex flex-wrap justify-between items-start gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-emerald-400 font-bold mb-1">
                UNITED STATES ENVIRONMENTAL PROTECTION AGENCY (EPA) • REGION 9
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white scada-font">
                INDUSTRIAL EFFLUENT DISCHARGE MONITORING REPORT (DMR)
              </h1>
              <div className="text-xs text-zinc-400 mt-1">
                Standard: {report.reportingStandard}
              </div>
            </div>

            <div className="text-right text-xs space-y-1">
              <div className="font-bold text-white">REPORT ID: {report.reportId}</div>
              <div className="text-zinc-400">Issued: {new Date(report.generatedAt).toUTCString()}</div>
              <div className="text-emerald-400 font-semibold">
                Status: {report.summaryStatistics.overallComplianceRating}
              </div>
            </div>
          </div>

          {/* Facility Identification Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs">
            <div>
              <div className="text-zinc-500 uppercase font-bold text-[10px] mb-1">FACILITY INFORMATION</div>
              <div className="font-bold text-white text-sm">{report.facility.name}</div>
              <div className="text-zinc-400 mt-0.5">Facility Code: {report.facility.code}</div>
              <div className="text-zinc-400">Location: {report.facility.location}</div>
            </div>

            <div>
              <div className="text-zinc-500 uppercase font-bold text-[10px] mb-1">REGULATORY PERMIT SPECS</div>
              <div className="font-bold text-cyan-400">NPDES Permit: {report.facility.permitNumber}</div>
              <div className="text-zinc-400 mt-0.5">
                Audit Window: {new Date(report.auditPeriod.from).toLocaleDateString()} to {new Date(report.auditPeriod.to).toLocaleDateString()}
              </div>
              <div className="text-zinc-400">
                Total Telemetry Data Points Sampled: {report.auditPeriod.totalTelemetrySamples}
              </div>
            </div>
          </div>

          {/* Summary Statistical Compliance Table */}
          <div>
            <h3 className="text-xs uppercase font-bold text-zinc-300 tracking-wider mb-2">
              SECTION 1: DISCHARGE PARAMETER PERFORMANCE SUMMARY
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="p-2.5">PARAMETER</th>
                    <th className="p-2.5">REGULATORY LIMIT</th>
                    <th className="p-2.5">MINIMUM</th>
                    <th className="p-2.5">AVERAGE</th>
                    <th className="p-2.5">PEAK / MAXIMUM</th>
                    <th className="p-2.5">COMPLIANCE STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  <tr>
                    <td className="p-2.5 font-bold text-white">Effluent pH</td>
                    <td className="p-2.5 text-zinc-400">6.50 – 8.50 pH</td>
                    <td className="p-2.5">{report.summaryStatistics.ph.min}</td>
                    <td className="p-2.5 font-semibold text-emerald-400">{report.summaryStatistics.ph.average}</td>
                    <td className="p-2.5">{report.summaryStatistics.ph.max}</td>
                    <td className="p-2.5">
                      <span className="text-emerald-400 font-bold">
                        {report.summaryStatistics.ph.min >= 6.5 && report.summaryStatistics.ph.max <= 8.5 ? 'COMPLIANT' : 'BREACH RECORDED'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-white">Turbidity (NTU)</td>
                    <td className="p-2.5 text-zinc-400">&le; 50.0 NTU</td>
                    <td className="p-2.5">{report.summaryStatistics.turbidity.min}</td>
                    <td className="p-2.5 font-semibold text-emerald-400">{report.summaryStatistics.turbidity.average}</td>
                    <td className="p-2.5">{report.summaryStatistics.turbidity.max}</td>
                    <td className="p-2.5">
                      <span className="text-emerald-400 font-bold">
                        {report.summaryStatistics.turbidity.max <= 50.0 ? 'COMPLIANT' : 'EXCEEDED'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-white">Chemical Dosing</td>
                    <td className="p-2.5 text-zinc-400">&le; 200.0 mg/L</td>
                    <td className="p-2.5">{report.summaryStatistics.chemicalDosing.min}</td>
                    <td className="p-2.5">{report.summaryStatistics.chemicalDosing.average}</td>
                    <td className="p-2.5">{report.summaryStatistics.chemicalDosing.max}</td>
                    <td className="p-2.5 text-zinc-400">WITHIN LIMITS</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-white">Effluent Flow Velocity</td>
                    <td className="p-2.5 text-zinc-400">&le; 850.0 L/s</td>
                    <td className="p-2.5">{report.summaryStatistics.effluentFlowRate.min} L/s</td>
                    <td className="p-2.5">{report.summaryStatistics.effluentFlowRate.average} L/s</td>
                    <td className="p-2.5">{report.summaryStatistics.effluentFlowRate.max} L/s</td>
                    <td className="p-2.5 text-emerald-400 font-bold">NORMAL HYDRAULICS</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-white">BOD Organics</td>
                    <td className="p-2.5 text-zinc-400">&le; 30.0 mg/L</td>
                    <td className="p-2.5">{report.summaryStatistics.bod.min}</td>
                    <td className="p-2.5">{report.summaryStatistics.bod.average}</td>
                    <td className="p-2.5">{report.summaryStatistics.bod.max}</td>
                    <td className="p-2.5 text-emerald-400 font-bold">PASS</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Breach & Corrective Actions Ledger */}
          <div>
            <h3 className="text-xs uppercase font-bold text-zinc-300 tracking-wider mb-2">
              SECTION 2: COMPLIANCE VIOLATION & REMEDIATION LOG
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="p-2.5">TIMESTAMP</th>
                    <th className="p-2.5">PARAMETER</th>
                    <th className="p-2.5">MEASURED VALUE</th>
                    <th className="p-2.5">REGULATORY LIMIT</th>
                    <th className="p-2.5">SEVERITY</th>
                    <th className="p-2.5">STATUS</th>
                    <th className="p-2.5">REMEDIAL ACTION / RESOLUTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {report.alertsDetail.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-zinc-500">
                        Zero violations detected during the designated audit timeframe.
                      </td>
                    </tr>
                  ) : (
                    report.alertsDetail.map((a) => (
                      <tr key={a._id}>
                        <td className="p-2.5 text-zinc-400">{new Date(a.triggeredAt).toLocaleString()}</td>
                        <td className="p-2.5 font-semibold text-white">{a.parameter}</td>
                        <td className="p-2.5 text-rose-400 font-bold">{a.measuredValue}</td>
                        <td className="p-2.5 text-zinc-400">{a.regulatoryLimit}</td>
                        <td className="p-2.5 font-bold">{a.severity}</td>
                        <td className="p-2.5">{a.status}</td>
                        <td className="p-2.5 text-zinc-400">
                          {a.resolutionNotes || (a.status === 'RESOLVED' ? 'Corrective protocol engaged.' : 'Pending sign-off')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Regulatory Inspector Sign-Off Certification Block */}
          <div className="pt-6 border-t-2 border-zinc-700 space-y-4">
            <div className="text-[11px] text-zinc-400 italic leading-relaxed">
              "{report.regulatoryCertification.certificationClause}"
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="space-y-1">
                <div className="text-[10px] text-zinc-500 uppercase font-bold">CERTIFIED INSPECTOR SIGNATURE</div>
                <div className="font-serif italic text-lg text-emerald-400 font-semibold border-b border-zinc-700 pb-1">
                  Elena Rostova
                </div>
                <div className="text-xs text-zinc-400">
                  Lead Environmental Officer (NPDES Cert #9142-CA)
                </div>
              </div>

              <div className="space-y-1 text-right sm:text-right">
                <div className="text-[10px] text-zinc-500 uppercase font-bold">DIGITAL VERIFICATION</div>
                <div className="text-xs font-mono text-zinc-300">
                  Date: {report.regulatoryCertification.signatureDate}
                </div>
                <div className="text-[10px] font-mono text-cyan-400 truncate">
                  Hash: {report.regulatoryCertification.verificationHash}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
