import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import Select from "react-select";
import supabase from "../lib/supabase-client";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { formatDate } from "../utils/FormatThings";
import LoadingFull from "../components/ui/LoadingFull";
import { Message } from "../features/Chat/Message";
import { useCurrentUser } from "../hooks/useCurrentUser";

const Listing = () => {
  const { uid } = useParams();
  const [moto, setMoto] = useState([]);
  const currentUser = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [filters, setFilters] = useState({
    sortBy: "Newest",
  });

  const filterOptions = {
    sortBy: [
      { value: "Newest", label: "Newest First" },
      { value: "Oldest", label: "Oldest First" },
      { value: "Highest", label: "Highest Price" },
      { value: "Lowest", label: "Lowest Price" },
    ],
  };

  const handleDelete = async (motoId) => {
    try {
      const { data: motoToDelete, error: fetchError } = await supabase
        .from("MOTORCYCLE")
        .select("image_url")
        .eq("id", motoId)
        .single();

      if (fetchError) throw fetchError;

      if (motoToDelete.image_url && motoToDelete.image_url.length > 0) {
        const filesToDelete = motoToDelete.image_url.map((url) => {
          const parts = url.split("/");
          return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
        });

        const { error: deleteFilesError } = await supabase.storage
          .from("motorcycle-media")
          .remove(filesToDelete);

        if (deleteFilesError) throw deleteFilesError;
      }

      const { error: deleteRecordError } = await supabase
        .from("MOTORCYCLE")
        .delete()
        .eq("id", motoId);

      if (deleteRecordError) throw deleteRecordError;

      setMoto(moto.filter((item) => item.id !== motoId));
    } catch (error) {
      console.error("Delete error:", error);
      alert("Error deleting motorcycle. Please try again.");
    }
  };

  const filteredMotos = moto
    .filter((motoItem) => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesBrand = motoItem.brand
          ?.toLowerCase()
          .includes(searchLower);
        const matchesModel = motoItem.model
          ?.toLowerCase()
          .includes(searchLower);
        const matchesTrim = motoItem.trim?.toLowerCase().includes(searchLower);

        const matchesId = motoItem.id?.toString().includes(searchTerm);

        if (!matchesBrand && !matchesModel && !matchesId && !matchesTrim) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case "Newest":
          return new Date(b.created_at) - new Date(a.created_at);
        case "Oldest":
          return new Date(a.created_at) - new Date(b.created_at);
        case "Highest":
          return (b.price || 0) - (a.price || 0);
        case "Lowest":
          return (a.price || 0) - (b.price || 0);
        default:
          return 0;
      }
    });

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  };

  useEffect(() => {
    document.title = "Listing";
  }, []);

  useEffect(() => {
    const fetchMotoData = async () => {
      try {
        const { data: motoData, error: motoError } = await supabase
          .from("MOTORCYCLE")
          .select("*")
          .eq("uid", uid)
          .order("created_at", { ascending: false });

        if (motoError) throw motoError;
        setMoto(motoData || []);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };
    fetchMotoData();
  }, [uid]);

  if (loading) return <LoadingFull />;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <Message />
      <div
        id="title"
        className="flex flex-col justify-center items-center w-full gap-2.5 mb-5"
      >
        <span className="text-black font-bold text-4xl">Listing</span>
        <span className="text-grey font-light text-xl">Track your listing</span>
      </div>

      <div className="flex flex-col items-center gap-2.5 p-2.5 w-full bg-white rounded-xl">
        <div
          id="actionBar-transaction"
          className="flex flex-col md:flex-row p-2.5 justify-between items-center w-full"
        >
          <div
            id="searchBar"
            className="flex p-2.5 items-center gap-2.5 border-1 border-grey rounded-sm"
          >
            <img src="/icons/BlackSearch.svg" alt="" />
            <input
              type="text"
              placeholder="Search by id, brand, model"
              className="text-grey bg-transparent outline-none w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div
            id="typeStatusTimeBar-transaction"
            className="hidden md:block items-center gap-2.5 p-2.5"
          >
            <div className="flex items-center gap-[5px]">
              <div className="flex items-center gap-[5px]">
                <div className="flex items-center gap-[5px]">
                  <Select
                    options={filterOptions.sortBy}
                    defaultValue={filterOptions.sortBy.find(
                      (opt) => opt.value === "Newest"
                    )}
                    isSearchable={false}
                    onChange={(selected) =>
                      handleFilterChange("sortBy", selected.value)
                    }
                    className="w-40 text-md"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center w-full py-[15px] gap-[5px]">
        <div
          id="rowType"
          className="flex justify-center items-center md:grid md:grid-cols-5 gap-2.5 p-2.5 w-full bg-white border-1 border-border-white rounded-md"
        >
          <div
            id="transactionCol"
            className="flex items-center p-2.5 gap-[5px]"
          >
            <span className="font-bold">Motorcycles</span>
          </div>
          <div
            id="dateCol"
            className="hidden md:flex items-center p-2.5 gap-[5px]"
          >
            <span className="font-bold">Date</span>
          </div>
          <div
            id="amountCol"
            className="hidden md:flex items-center p-2.5 gap-[5px]"
          >
            <span className="font-bold">Amount</span>
          </div>
          <div
            id="amountCol"
            className="hidden md:flex items-center p-2.5 gap-[5px]"
          >
            <span className="font-bold">Status</span>
          </div>

          {currentUser.id === uid && (
            <div
              id="actionCol"
              className="hidden md:flex items-center p-2.5 gap-[5px]"
            >
              <span className="font-bold">Actions</span>
            </div>
          )}
        </div>
      </div>

      <div
        id="itemsList-transaction"
        className="flex flex-col gap-2.5 w-full mb-5"
      >
        {filteredMotos.length === 0 ? (
          <div className="text-center py-10">No listings found</div>
        ) : (
          filteredMotos
            .map((motoItem) => (
              <div key={motoItem.id}>
                <div className="hidden md:grid grid-cols-5 gap-2.5 p-2.5 w-full bg-white border-1 border-border-white rounded-md">
                  <div className="flex justify-start items-center p-1 gap-[10px]">
                    <img
                      src={motoItem.image_url?.[0] || "/img/R7_Sample.jpg"}
                      alt="Motorcycle"
                      className="rounded-sm w-[40px] h-[40px] object-cover"
                    />
                    <div className="flex flex-col justify-start items-start gap-1">
                      <Link
                        to={{
                          pathname: "/motorcycle-detail",
                          search: `?${new URLSearchParams({
                            uid: motoItem.uid || "",
                            id: motoItem.id || "",
                            year: motoItem.year || "",
                            brand: motoItem.brand || "",
                            model: motoItem.model || "",
                            trim: motoItem.trim || "",
                          }).toString()}`,
                        }}
                        className="font-bold text-blue underline"
                      >
                        {motoItem.brand} {motoItem.model} {motoItem.trim}
                      </Link>
                      <div className="flex flex-col justify-start items-start gap-0">
                        <span className="font-light text-sm">
                          {motoItem.mile} Miles
                        </span>
                        <span className="font-light text-sm">
                          {motoItem.year}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center p-1 gap-[5px]">
                    <span>{formatDate(motoItem.created_at)}</span>
                  </div>
                  <div className="flex items-center p-1 gap-[5px]">
                    <span className="font-bold">
                      ${motoItem.price?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col justify-center items-start">
                    <div
                      className={`flex flex-row justify-center items-center p-[5px] gap-[5px] rounded-sm w-fit ${
                        motoItem.is_sold
                          ? "bg-[#C4FFAE] text-[#1B7200]"
                          : "bg-[#FFECAE] text-[#725C00]"
                      }`}
                    >
                      <img
                        src={`${motoItem.is_sold ? "/icons/CheckCircle.svg" : "/icons/PendingCircle.svg"}`}
                        alt=""
                      />
                      <span className="font-light">
                        {motoItem.is_sold ? "Sold" : "Selling"}
                      </span>
                    </div>
                  </div>
                  {currentUser.id === uid && (
                    <div className="relative flex items-center p-2.5 gap-[5px]">
                      <Menu
                        as="div"
                        className="relative inline-block text-left"
                      >
                        <div>
                          <MenuButton className="flex items-center gap-[5px] rounded-sm border-1 border-grey p-[5px] hover:bg-gray-50">
                            <span className="text-grey">Action</span>
                            <img src="/icons/MoreDot.svg" alt="" />
                          </MenuButton>
                        </div>

                        <MenuItems className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-border-white ring-opacity-5 focus:outline-none">
                          <div className="py-1">
                            <MenuItem>
                              {({ active }) => (
                                <Link
                                  to={`/edit/${motoItem.id}`}
                                  className={`${
                                    active
                                      ? "bg-gray-100 text-gray-900"
                                      : "text-gray-700"
                                  } w-full px-4 py-2 text-left text-md flex flex-row gap-2`}
                                >
                                  <img src="/icons/Edit.svg" alt="" />
                                  Edit Listing
                                </Link>
                              )}
                            </MenuItem>
                            <MenuItem>
                              {({ active }) => (
                                <button
                                  type="button"
                                  onClick={() => handleDelete(motoItem.id)}
                                  className={`${
                                    active
                                      ? "bg-gray-100 text-gray-900"
                                      : "text-gray-700"
                                  } w-full px-4 py-2 text-left text-md flex flex-row gap-2`}
                                >
                                  <img src="/icons/Delete.svg" alt="" />
                                  Delete Listing
                                </button>
                              )}
                            </MenuItem>
                          </div>
                        </MenuItems>
                      </Menu>
                    </div>
                  )}
                </div>
                <div className="flex md:hidden justify-center items-start gap-2.5 p-1 w-full bg-white border-1 border-border-white rounded-md">
                  <div className="flex flex-col p-2.5 gap-3 w-full">
                    <div className="flex flex-col w-full">
                      <div className="flex gap-5">
                        <div className="flex flex-col gap-1 justify-center items-center">
                          <img
                            src={
                              motoItem.image_url?.[0] || "/img/R7_Sample.jpg"
                            }
                            alt="Motorcycle"
                            className="rounded-sm w-[50px] h-[50px] object-cover"
                          />
                          <div className="w-full h-[1px] bg-grey"></div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Link
                            to={{
                              pathname: "/motorcycle-detail",
                              search: `?${new URLSearchParams({
                                uid: motoItem.uid || "",
                                id: motoItem.id || "",
                                year: motoItem.year || "",
                                brand: motoItem.brand || "",
                                model: motoItem.model || "",
                                trim: motoItem.trim || "",
                              }).toString()}`,
                            }}
                            className="font-bold text-blue underline"
                          >
                            {motoItem.brand} {motoItem.model}
                          </Link>
                          <div className="flex flex-col gap-0">
                            <span className="font-light italic text-sm">
                              {motoItem.trim} Edition
                            </span>
                            <span className="font-light text-sm">
                              {motoItem.mile} Miles
                            </span>
                            <span className="font-light text-sm">
                              {motoItem.year}
                            </span>
                          </div>
                          <span className="font-bold">
                            ${motoItem.price?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-grey w-full h-[1px]"></div>
                    <div>
                      <span>Listed on {formatDate(motoItem.created_at)}</span>
                    </div>
                    <div className="flex flex-col justify-center items-start">
                      <div
                        className={`flex flex-row justify-center items-center p-[5px] gap-[5px] rounded-sm w-fit ${
                          motoItem.is_sold
                            ? "bg-[#C4FFAE] text-[#1B7200]"
                            : "bg-[#FFECAE] text-[#725C00]"
                        }`}
                      >
                        <img
                          src={`${motoItem.is_sold ? "/icons/CheckCircle.svg" : "/icons/PendingCircle.svg"}`}
                          alt=""
                        />
                        <span className="font-bold">
                          {motoItem.is_sold ? "Sold" : "Selling"}
                        </span>
                      </div>
                    </div>
                  </div>
                  {currentUser.id === uid && (
                    <div className="flex flex-col gap-2.5 w-40 p-2.5">
                      <Link
                        to={`/edit/${motoItem.id}`}
                        className="bg-blue flex flex-row gap-1 justify-center items-start p-2.5 rounded-sm"
                      >
                        <img src="/icons/EditWhite.svg" alt="" />
                        <span className="text-md text-white font-bold">
                          Edit
                        </span>
                      </Link>
                      <button
                        onClick={() => handleDelete(motoItem.id)}
                        className="bg-[#FFAEAE] flex flex-row gap-1 justify-center items-start p-2.5 rounded-sm"
                      >
                        <img src="/icons/DeleteRed.svg" alt="" />
                        <span className="text-md font-bold text-[#720000]">
                          Delete
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default Listing;
