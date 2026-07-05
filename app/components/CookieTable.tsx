import { Cookie } from "@/types/cookies";

type sortKeys = keyof Cookie;

const TABLE_COLUMNS: { key: sortKeys; label: string }[] = [
    { key: "name", label: "Name" },
    { key: "value", label: "Value" },
    { key: "domain", label: "Domain" },
    { key: "path", label: "Path" },
    { key: "expires", label: "Expires" },
    { key: "secure", label: "Secure" },
    { key: "httpOnly", label: "HttpOnly" },
    { key: "sameSite", label: "SameSite" },
];

export default function CookieTable({ cookies }: { cookies: Cookie[] }) {
    return (
        <div className="mt-5 bg-slate-800 border border-stone-500 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-wrap">
                    <thead className="border-b">
                        <tr>
                            {TABLE_COLUMNS.map((column) => (
                                <th key={column.key} className="p-3 text-left text-slate-200 font-medium whitespace-nowrap">
                                    {column.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                       { cookies.length === 0 ? (
                           <tr>
                            <td colSpan={TABLE_COLUMNS.length} className="p-3 text-center text-slate-200">
                                No cookies found for your request.
                            </td>
                           </tr>
                       ) : (
                        cookies.map((cookie, index) => {
                            const id = `${cookie.name} - ${cookie.domain} - ${index}`;
                            return (
                                <>
                                    <tr key={`cookie-${id}`} className="border-b last:border-b-0 border-lightblue-400">
                                        {TABLE_COLUMNS.map((column) => (
                                            <td key={column.key} className="p-3 font-medium truncate max-w-[150px] whitespace-nowrap">
                                                {cookie[column.key] !== undefined ? cookie[column.key]?.toString() : ""}
                                            </td>
                                        ))}
                                    </tr>
                                </>
                            );
                        })
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}