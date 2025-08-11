"use client";

import { useQuery } from '@tanstack/react-query';

import { useTRPC } from "@/trpc/client"

export default function Home() {
  const trpc = useTRPC();
  const categories = useQuery(trpc.categories.getMany.queryOptions())
  return (
    <div>
      <p>is loading: {`${categories.isLoading}`}</p>
      {JSON.stringify(categories.data, null, 2)}
    </div>
  );
};
