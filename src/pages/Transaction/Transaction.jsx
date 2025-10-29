import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import Select from "react-select";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import supabase from "../../lib/supabase-client";
import { formatDate } from "../../utils/FormatThings";
import { Message } from "../../features/Chat/Message";
import MonthlySalesBarChart from "./components/MonthlySalesBarChart";
import MonthlySalesPieChart from "./components/MonthlySalesPieChart";
import LoadingFull from "../../components/ui/LoadingFull";
import { useCurrentUser } from "../../hooks/useCurrentUser";

const Transaction = () => {
  const currentUser = useCurrentUser();
  const [transactions, setTransactions] = useState([]);
  const [messageReceiver, setMessageReceiver] = useState(null);
  const [loading, setLoading] = useState(true);

  const currentYear = new Date().getFullYear(); // Get the current year
  const years = Array.from({ length: 6 }, (_, i) => { // Create an array of years
    const year = currentYear - i;
    return { value: year, label: year.toString() };
  });
  const [selectedYear, setSelectedYear] = useState(years[0].value); // Set the default selected year

  const [searchTerm, setSearchTerm] = useState(""); // State for search term

  const [filters, setFilters] = useState({ // State for filters
    sortBy: "Newest",
    type: "All",
    status: "All",
  });

  const filterOptions = { // Filter options for sorting and filtering
    sortBy: [
      { value: "Newest", label: "Newest First" },
      { value: "Oldest", label: "Oldest First" },
      { value: "Highest", label: "Highest Price" },
      { value: "Lowest", label: "Lowest Price" },
    ],
    type: [
      { value: "All", label: "All Types" },
      { value: "Buying", label: "Buying" },
      { value: "Selling", label: "Selling" },
    ],
    status: [
      { value: "All", label: "All Statuses" },
      { value: "Completed", label: "Completed" },
      { value: "In Progress", label: "In Progress" },
    ],
  };

  const filteredTransactions = transactions // Filter transactions based on search term and selected filters
    .filter((transaction) => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase(); // Convert search term to lowercase
        const matchesBrand = transaction.motorcycle?.brand // Check if motorcycle brand matches search term
          ?.toLowerCase()
          .includes(searchLower); // Check if motorcycle model matches search term
        const matchesModel = transaction.motorcycle?.model // Check if motorcycle model matches search term
          ?.toLowerCase()
          .includes(searchLower);
        const matchesId = transaction.id_moto?.toString().includes(searchTerm); // Check if transaction ID matches search term

        if (!matchesBrand && !matchesModel && !matchesId) { // If none match, return false
          return false;
        }
      }

      if (filters.type !== "All" && transaction.type !== filters.type) { // Filter by type
        return false;
      }

      if (filters.status !== "All") { // Filter by status
        const statusMatch =
          filters.status === "Completed" // Check if status is completed
            ? transaction.completed
            : !transaction.completed;
        if (!statusMatch) return false;
      }

      return true;
    })
    .sort((a, b) => { // Sort transactions based on selected sort option
      switch (filters.sortBy) { // Sort by selected option
        case "Newest":
          return new Date(b.created_at) - new Date(a.created_at);
        case "Oldest":
          return new Date(a.created_at) - new Date(b.created_at);
        case "Highest":
          return (b.motorcycle?.price || 0) - (a.motorcycle?.price || 0);
        case "Lowest":
          return (a.motorcycle?.price || 0) - (b.motorcycle?.price || 0);
        default:
          return 0;
      }
    });

  const handleFilterChange = (filterName, value) => { // Handle filter changes
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  };

  const hasSellerTransactions = transactions.some( // Check if there are any transactions for the current user
    (transaction) => // Check if the transaction is completed
      transaction.uid_seller === currentUser?.id &&
      new Date(transaction.created_at).getFullYear() === selectedYear &&
      transaction.completed
  );

  const handleSold = async (id, motoId) => { // Handle marking a transaction as sold
    try {
      const { data: transactionData, error: transactionError } = await supabase // Fetch transaction data
        .from("TRANSACTION")
        .select("*")
        .eq("id", id)
        .single();

      if (transactionError) throw transactionError;

      const sellerId = transactionData.uid_seller; // Get the seller ID

      const { error: updateTransactionError } = await supabase // Update the transaction to mark it as completed
        .from("TRANSACTION")
        .update({ completed: true })
        .eq("id", id);

      if (updateTransactionError) throw updateTransactionError;

      const { error: motoError } = await supabase // Update the motorcycle to mark it as sold
        .from("MOTORCYCLE")
        .update({ is_sold: true })
        .eq("id", motoId);

      if (motoError) throw motoError;

      const { data: sellerData, error: sellerError } = await supabase // Fetch the seller's sold list
        .from("USER")
        .select("sold_list")
        .eq("uid", sellerId)
        .single();

      if (sellerError) throw sellerError;

      const updatedSellerSoldList = sellerData.sold_list // Update the seller's sold list
        ? [...sellerData.sold_list, motoId]
        : [motoId];

      await supabase
        .from("USER")
        .update({ sold_list: updatedSellerSoldList })
        .eq("uid", sellerId);
    } catch (error) {
      console.error("Error completing transaction:", error);
      alert("Failed to complete transaction");
    }
  };

  const handleChat = (transaction) => { // Handle opening the chat with the other user
    if (!transaction || !currentUser) return;

    const receiver =
      transaction.uid_buyer === currentUser.id
        ? transaction.seller
        : transaction.buyer;

    if (receiver) {
      setMessageReceiver(receiver);
    }
  };

  const handleCancel = async (transaction) => { // Handle cancelling a transaction
    if (!transaction || !currentUser) return;

    try {
      const shouldCancel = window.confirm(
        "Are you sure you want to cancel this transaction?"
      );
      if (!shouldCancel) return;

      const { error: transactionError } = await supabase
        .from("TRANSACTION")
        .delete()
        .eq("id", transaction.id);

      if (transactionError) throw transactionError;

      setTransactions((prev) => prev.filter((t) => t.id !== transaction.id)); // Remove the cancelled transaction from the state

      alert("Transaction cancelled successfully");
    } catch (error) {
      console.error("Error cancelling transaction:", error);
      alert("Failed to cancel transaction");
    }
  };

  useEffect(() => { // Fetch transactions when the component mounts or when currentUser changes
    const fetchTransactions = async () => { // Fetch transactions from the database
      if (!currentUser) return;

      setLoading(true);
      try {
        const { data, error } = await supabase // Fetch transactions for the current user
          .from("TRANSACTION")
          .select("*")
          .or(`uid_buyer.eq.${currentUser.id},uid_seller.eq.${currentUser.id}`);

        if (error) throw error;

        const transactionsWithDetails = await Promise.all( // Fetch details for each transaction
          (data || []).map(async (transaction) => {
            const { data: motoData } = await supabase
              .from("MOTORCYCLE")
              .select("*")
              .eq("id", transaction.id_moto)
              .single();

            const { data: buyerData } = await supabase
              .from("USER")
              .select("*")
              .eq("uid", transaction.uid_buyer)
              .single();

            const { data: sellerData } = await supabase
              .from("USER")
              .select("*")
              .eq("uid", transaction.uid_seller)
              .single();

            return {
              ...transaction,
              motorcycle: motoData,
              buyer: buyerData,
              seller: sellerData,
              type:
                transaction.uid_buyer === currentUser.id ? "Buying" : "Selling",
            };
          })
        );

        setTransactions(transactionsWithDetails);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();

    const channel = supabase // Create a channel for real-time updates
      .channel("transaction-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "TRANSACTION",
        },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  useEffect(() => {
    document.title = "Transaction";
  }, []);

  if (loading) {
    return <LoadingFull />;
  }
  return (
    <div>
      {" "}
      <Message newChatReceiver={messageReceiver} />
      <div
        id="title"
        className="flex flex-col justify-center items-center w-full gap-2.5 mb-5"
      >
        <span className="text-black font-bold text-4xl">Transactions</span>
        <span className="text-grey font-light text-xl">Track your orders</span>
      </div>
      <div className="flex justify-center items-center mb-2.5">
        <div>
          <Select
            options={years}
            defaultValue={years[0]}
            onChange={(selected) => setSelectedYear(selected.value)}
          ></Select>
        </div>
      </div>
      {hasSellerTransactions ? (
        <div className="relative flex flex-col md:flex-row justify-center items-center md:h-100 mb-5">
          <div className="w-full md:w-[50vw] md:h-full flex justify-center items-center">
            <MonthlySalesBarChart
              transactions={transactions}
              currentUser={currentUser}
              selectedYear={selectedYear}
            />
          </div>
          <div className="md:hidden w-full h-[1px] bg-grey"></div>
          <div className="w-full md:w-[50vw] h-75 md:h-full flex justify-center items-center">
            <MonthlySalesPieChart
              transactions={transactions}
              currentUser={currentUser}
              selectedYear={selectedYear}
            />
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center mb-5">
          <span className="font-light">No data to show</span>
        </div>
      )}
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
            className="hidden md:grid grid-cols-3 items-center gap-2.5 p-2.5"
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

            <div className="flex items-center gap-[5px]">
              <Select
                options={filterOptions.type}
                defaultValue={filterOptions.type[0]}
                isSearchable={false}
                onChange={(selected) =>
                  handleFilterChange("type", selected.value)
                }
                className="w-40 text-md"
              />
            </div>

            <div className="flex items-center gap-[5px]">
              <Select
                options={filterOptions.status}
                defaultValue={filterOptions.status[0]}
                isSearchable={false}
                onChange={(selected) =>
                  handleFilterChange("status", selected.value)
                }
                className="w-40 text-md"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center w-full py-[15px] gap-[5px]">
        <div
          id="rowType"
          className="flex justify-center items-center md:grid md:grid-cols-7 gap-2.5 p-2.5 w-full bg-white border-1 border-border-white rounded-md"
        >
          <div
            id="transactionCol"
            className="flex items-center p-2.5 gap-[5px]"
          >
            <span className="font-bold">Transaction</span>
          </div>
          <div
            id="userCol"
            className="hidden md:flex items-center p-2.5 gap-[5px]"
          >
            <span className="font-bold">User</span>
          </div>
          <div
            id="dateCol"
            className="hidden md:flex items-center p-2.5 gap-[5px]"
          >
            <span className="font-bold">Date</span>
          </div>
          <div
            id="typeCol"
            className="hidden md:flex items-center p-2.5 gap-[5px]"
          >
            <span className="font-bold">Type</span>
          </div>
          <div
            id="amountCol"
            className="hidden md:flex items-center p-2.5 gap-[5px]"
          >
            <span className="font-bold">Amount</span>
          </div>
          <div
            id="statusCol"
            className="hidden md:flex items-center p-2.5 gap-[5px]"
          >
            <span className="font-bold">Status</span>
          </div>
          <div
            id="actionCol"
            className="hidden md:flex items-center p-2.5 gap-[5px]"
          >
            <span className="font-bold">Actions</span>
          </div>
        </div>
        <div
          id="itemsList-transaction"
          className="flex flex-col gap-2.5 w-full mb-5"
        >
          {transactions.length === 0 ? (
            <div className="text-center py-10">No transactions found</div>
          ) : (
            filteredTransactions.map((transaction) => (
              <div key={transaction.id}>
                <div className="hidden md:grid grid-cols-7 gap-2.5 p-2.5 w-full bg-white border-1 border-border-white rounded-md">
                  <div className="flex justify-start items-center p-1 gap-[10px]">
                    <img
                      src={
                        transaction.motorcycle?.image_url?.[0] ||
                        "/img/R7_Sample.jpg"
                      }
                      alt="Motorcycle"
                      className="rounded-sm w-[40px] h-[40px] object-cover"
                    />
                    <div className="flex flex-col justify-start items-start gap-1">
                      <Link
                        to={{
                          pathname: "/motorcycle-detail",
                          search: `?${new URLSearchParams({
                            uid: transaction.motorcycle?.uid || "",
                            id: transaction.motorcycle?.id || "",
                            year: transaction.motorcycle?.year || "",
                            brand: transaction.motorcycle?.brand || "",
                            model: transaction.motorcycle?.model || "",
                            trim: transaction.motorcycle?.trim || "",
                          }).toString()}`,
                        }}
                        className="font-bold text-blue underline"
                      >
                        {transaction.motorcycle?.brand}{" "}
                        {transaction.motorcycle?.model}{" "}
                        {transaction.motorcycle?.trim}
                      </Link>
                      <div className="flex flex-col justify-start items-start gap-0">
                        <span className="font-light text-sm">
                          {transaction.motorcycle?.mile} Miles
                        </span>
                        <span className="font-light text-sm">
                          {transaction.motorcycle?.year}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center p-1 gap-[5px]">
                    <img
                      src={
                        transaction.type === "Buying"
                          ? transaction.seller?.avatar_url
                          : transaction.buyer?.avatar_url ||
                            "/img/R7_Sample.jpg"
                      }
                      alt="User"
                      className="rounded-sm w-[40px] h-[40px] object-cover"
                    />
                    <span>
                      {transaction.type === "Buying"
                        ? transaction.seller?.name
                        : transaction.buyer?.name}
                    </span>
                  </div>
                  <div className="flex items-center p-1 gap-[5px]">
                    <span>{formatDate(transaction.created_at)}</span>
                  </div>
                  <div className="flex items-center p-1 gap-[5px]">
                    <div>
                      {transaction.type === "Buying" ? (
                        <span className="font-light text-md bg-blue text-white p-1 rounded-sm">
                          Buying
                        </span>
                      ) : (
                        <span className="font-light text-md bg-yellow text-black p-1 rounded-sm">
                          Selling
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center p-1 gap-[5px]">
                    <span className="font-bold">
                      ${transaction.motorcycle?.price?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col justify-center items-start">
                    <div
                      className={`flex flex-row justify-center items-center p-[5px] gap-[5px] rounded-sm w-fit ${
                        transaction.completed
                          ? "bg-[#C4FFAE] text-[#1B7200]"
                          : "bg-[#FFECAE] text-[#725C00]"
                      }`}
                    >
                      <img
                        src={`${transaction.completed ? "/icons/CheckCircle.svg" : "/icons/PendingCircle.svg"}`}
                        alt=""
                      />
                      <span className="font-light">
                        {transaction.completed ? "Completed" : "In Progress"}
                      </span>
                    </div>
                  </div>
                  <div className="relative flex items-center p-2.5 gap-[5px]">
                    <Menu as="div" className="relative inline-block text-left">
                      <div>
                        <MenuButton className="flex items-center gap-[5px] rounded-sm border-1 border-grey p-[5px] hover:bg-gray-50">
                          <span className="text-grey">Action</span>
                          <img src="/icons/MoreDot.svg" alt="" />
                        </MenuButton>
                      </div>

                      <MenuItems className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-border-white ring-opacity-5 focus:outline-none">
                        <div className="py-1">
                          {transaction.type === "Selling" &&
                            transaction.completed === false && (
                              <MenuItem>
                                {({ active }) => (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleSold(
                                        transaction.id,
                                        transaction.id_moto
                                      )
                                    }
                                    className={`${
                                      active
                                        ? "bg-gray-100 text-gray-900"
                                        : "text-gray-700"
                                    } w-full px-4 py-2 text-left text-md flex flex-row gap-2`}
                                  >
                                    <img src="/icons/CheckCircle.svg" alt="" />
                                    Mark as Sold
                                  </button>
                                )}
                              </MenuItem>
                            )}
                          <MenuItem>
                            {({ active }) => (
                              <button
                                type="button"
                                onClick={() => handleChat(transaction)}
                                className={`${
                                  active
                                    ? "bg-gray-100 text-gray-900"
                                    : "text-gray-700"
                                } w-full px-4 py-2 text-left text-md flex flex-row gap-2`}
                              >
                                <img src="/icons/BlackChat.svg" alt="" />
                                Chat with other user
                              </button>
                            )}
                          </MenuItem>

                          {!transaction.completed && (
                            <MenuItem>
                              {({ active }) => (
                                <button
                                  type="button"
                                  onClick={() => handleCancel(transaction)}
                                  className={`${
                                    active
                                      ? "bg-gray-100 text-gray-900"
                                      : "text-gray-700"
                                  } w-full px-4 py-2 text-left text-md flex flex-row gap-2`}
                                >
                                  <img src="/icons/Close.svg" alt="" />
                                  Cancel
                                </button>
                              )}
                            </MenuItem>
                          )}
                        </div>
                      </MenuItems>
                    </Menu>
                  </div>
                </div>
                <div className="flex md:hidden justify-center items-start gap-2.5 p-1 w-full bg-white border-1 border-border-white rounded-md">
                  <div className="flex flex-col p-2.5 gap-3 w-full">
                    <div className="flex flex-col w-full">
                      <div className="flex gap-5">
                        <div className="flex flex-col gap-1 justify-center items-center">
                          <img
                            src={
                              transaction.motorcycle?.image_url?.[0] ||
                              "/img/R7_Sample.jpg"
                            }
                            alt="User"
                            className="rounded-sm w-[50px] h-[50px] object-cover"
                          />
                          <div className="w-full h-[1px] bg-grey"></div>
                          <div>
                            {transaction.type === "Buying" ? (
                              <span className="font-light text-sm bg-blue text-white p-1 rounded-sm">
                                Buying
                              </span>
                            ) : (
                              <span className="font-light text-sm bg-yellow text-black p-1 rounded-sm">
                                Selling
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Link
                            to={{
                              pathname: "/motorcycle-detail",
                              search: `?${new URLSearchParams({
                                uid: transaction.motorcycle?.uid || "",
                                id: transaction.motorcycle?.id || "",
                                year: transaction.motorcycle?.year || "",
                                brand: transaction.motorcycle?.brand || "",
                                model: transaction.motorcycle?.model || "",
                                trim: transaction.motorcycle?.trim || "",
                              }).toString()}`,
                            }}
                            className="font-bold text-blue underline"
                          >
                            {transaction.motorcycle?.brand}{" "}
                            {transaction.motorcycle?.model}
                          </Link>
                          <div className="flex flex-col gap-0">
                            <span className="font-light italic text-sm">
                              {transaction.motorcycle?.trim} Edition
                            </span>
                            <span className="font-light text-sm">
                              {transaction.motorcycle?.mile} Miles
                            </span>
                            <span className="font-light text-sm">
                              {transaction.motorcycle?.year}
                            </span>
                          </div>
                          <span className="font-bold">
                            ${transaction.motorcycle?.price?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-grey w-full h-[1px]"></div>
                    <div>
                      {transaction.type === "Buying" ? (
                        <span>
                          Buying from{" "}
                          <Link to={`/profile/${transaction.seller?.uid}`}>
                            <span className="font-bold text-blue underline">
                              {transaction.seller?.name}
                            </span>
                          </Link>
                        </span>
                      ) : (
                        <span>
                          Order from{" "}
                          <Link to={`/profile/${transaction.buyer?.uid}`}>
                            <span className="font-bold text-blue underline">
                              {transaction.buyer?.name}
                            </span>
                          </Link>
                        </span>
                      )}
                    </div>
                    <div
                      className={`flex flex-row justify-center items-center p-[5px] gap-[5px] rounded-sm w-fit ${
                        transaction.completed
                          ? "bg-[#C4FFAE] text-[#1B7200]"
                          : "bg-[#FFECAE] text-[#725C00]"
                      }`}
                    >
                      <img
                        src={`${transaction.completed ? "/icons/CheckCircle.svg" : "/icons/PendingCircle.svg"}`}
                        alt=""
                      />
                      <span className="font-light">
                        {transaction.completed ? "Completed" : "In Progress"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2.5 w-40 p-2.5">
                    <button
                      onClick={() => handleChat(transaction)}
                      className="bg-blue flex flex-row gap-1 justify-center items-start p-2.5 rounded-sm "
                    >
                      <img src="/icons/Chat.svg" alt="" />
                      <span className="text-md text-white font-bold">Chat</span>
                    </button>
                    {transaction.type === "Selling" &&
                      transaction.completed === false && (
                        <button
                          onClick={() =>
                            handleSold(transaction.id, transaction.id_moto)
                          }
                          className="bg-[#C4FFAE] flex flex-row gap-1 justify-center items-start p-2.5 rounded-sm "
                        >
                          <img src="/icons/CheckCircle.svg" alt="" />
                          <span className="text-md font-bold text-[#1B7200]">
                            Sold
                          </span>
                        </button>
                      )}
                    {!transaction.completed && (
                      <button
                        onClick={() => handleCancel(transaction)}
                        className="bg-red flex flex-row gap-1 justify-center items-start p-2.5 rounded-sm "
                      >
                        <img src="/icons/Close.svg" alt="" />
                        <span className="text-md font-bold">Cancel</span>
                      </button>
                    )}
                    <div className="flex items-center p-2.5 gap-[5px] w-full"></div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Transaction;
