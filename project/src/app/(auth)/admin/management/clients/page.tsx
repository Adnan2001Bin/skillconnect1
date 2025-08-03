
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 as Loader, Search, Trash2, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import axios from "axios";
import { Images } from "@/lib/images";

interface Client {
  _id: string;
  userName: string;
  email: string;
  role: "user";
  bio?: string;
}

export default function AdminClientsView() {
  const { status } = useSession();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const primaryDarkGray = "#2D3748";
  const accentColor = "#A5BFCC";
  const activeTextColor = "#E0E0E0";
  const neutralTextColor = "#B0B0B0";
  const white = "#FFFFFF";
  const inputBorderColor = "#667580";

  useEffect(() => {
    if (status === "authenticated") {
      fetchClients();
    }
  }, [status]);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/admin/clients");
      if (response.data.success) {
        setClients(response.data.data);
        setFilteredClients(response.data.data);
      } else {
        toast.error("Error", {
          description: response.data.message || "Failed to fetch clients.",
          className:
            "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
          duration: 4000,
        });
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("Error", {
        description: "An error occurred while fetching clients.",
        className:
          "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (clientId: string) => {
    try {
      const response = await axios.delete(`/api/admin/clients`, {
        data: { clientId },
      });
      if (response.data.success) {
        setClients((prev) => prev.filter((client) => client._id !== clientId));
        setFilteredClients((prev) =>
          prev.filter((client) => client._id !== clientId)
        );
        toast.success("Success", {
          description: "Client deleted successfully.",
          className:
            "bg-green-600 text-white border-green-700 backdrop-blur-md bg-opacity-80",
          duration: 4000,
        });
      } else {
        throw new Error(response.data.message || "Failed to delete client.");
      }
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error("Error", {
        description:
          error instanceof Error ? error.message : "Failed to delete client.",
        className:
          "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
        duration: 4000,
      });
    }
  };

  useEffect(() => {
    let filtered = clients;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (client) =>
          client.userName.toLowerCase().includes(query) ||
          client.email.toLowerCase().includes(query) ||
          client.bio?.toLowerCase().includes(query)
      );
    }
    setFilteredClients(filtered);
  }, [searchQuery, clients]);

  if (status === "loading") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: primaryDarkGray }}
      >
        <Loader
          className="animate-spin h-10 w-10 mr-3"
          style={{ color: accentColor }}
        />
        <p className="text-xl font-semibold" style={{ color: activeTextColor }}>
          Loading client data...
        </p>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: primaryDarkGray }}
      >
        <p className="text-lg font-semibold" style={{ color: "#EF4444" }}>
          Access denied. Please sign in as an admin.
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen font-sans py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto shadow-xl rounded-lg overflow-hidden border border-gray-900"
      style={{
        backgroundImage: `url(${
          Images.adminViewbackground ? Images.adminViewbackground.src : ""
        })`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <h1
        className="text-4xl font-extrabold mb-8 text-center"
        style={{ color: activeTextColor }}
      >
        <span style={{ color: accentColor }}>Client</span> Management Dashboard
      </h1>

      <div
        className="mb-10 p-6 sm:p-8 rounded-xl shadow-2xl"
        style={{ backgroundColor: "rgba(58, 71, 80, 0.6)" }}
      >
        <div className="flex items-center mb-6">
          <Search className="h-6 w-6 mr-3" style={{ color: accentColor }} />
          <h2 className="text-2xl font-bold" style={{ color: activeTextColor }}>
            Search Clients
          </h2>
        </div>
        <div className="relative">
          <Input
            id="search-input"
            type="text"
            placeholder="Search by name, email, or bio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 text-base rounded-lg h-auto border-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              backgroundColor: white,
              borderColor: inputBorderColor,
              color: primaryDarkGray,
              boxShadow: `0 0 0 2px ${accentColor}`,
            }}
            aria-label="Search clients"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader
            className="animate-spin h-10 w-10"
            style={{ color: accentColor }}
          />
          <p className="ml-3 text-xl" style={{ color: neutralTextColor }}>
            Loading clients...
          </p>
        </div>
      ) : filteredClients.length === 0 ? (
        <p
          className="text-center text-xl font-medium"
          style={{ color: neutralTextColor }}
        >
          No clients found matching your criteria. Try adjusting your search.
        </p>
      ) : (
        <div className="rounded-xl overflow-hidden shadow-2xl">
          <Table>
            <TableHeader>
              <TableRow
                style={{ backgroundColor: "rgba(58, 71, 80, 0.8)" }}
              >
                <TableHead style={{ color: activeTextColor }}>Username</TableHead>
                <TableHead style={{ color: activeTextColor }}>Email</TableHead>
                <TableHead style={{ color: activeTextColor }}>Bio</TableHead>
                <TableHead style={{ color: activeTextColor }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow
                  key={client._id}
                  className="hover:bg-[#A5BFCC]/10"
                  style={{ backgroundColor: "rgba(58, 71, 80, 0.6)" }}
                >
                  <TableCell style={{ color: neutralTextColor }}>
                    {client.userName}
                  </TableCell>
                  <TableCell style={{ color: neutralTextColor }}>
                    {client.email}
                  </TableCell>
                  <TableCell style={{ color: neutralTextColor }}>
                    {client.bio
                      ? client.bio.length > 50
                        ? `${client.bio.slice(0, 50)}...`
                        : client.bio
                      : "No bio"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/management/clients/${client._id}`)}
                        style={{
                          borderColor: accentColor,
                          color: accentColor,
                        }}
                        className="hover:bg-[#A5BFCC]/20"
                      >
                        <User className="h-4 w-4 mr-2" />
                        View Profile
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(client._id)}
                        style={{
                          backgroundColor: "#EF4444",
                          color: white,
                        }}
                        className="hover:bg-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
