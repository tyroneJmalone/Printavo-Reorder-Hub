import { log } from "./index";

const PRINTAVO_API_URL = "https://www.printavo.com/api/v2";

function getHeaders() {
  const email = process.env.PRINTAVO_API_EMAIL;
  const token = process.env.PRINTAVO_API_TOKEN;
  if (!email || !token) {
    throw new Error("Printavo API credentials not configured");
  }
  return {
    "Content-Type": "application/json",
    email,
    token,
  };
}

async function graphqlQuery(query: string, variables?: Record<string, any>) {
  const res = await fetch(PRINTAVO_API_URL, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const text = await res.text();
    log(`Printavo API error: ${res.status} ${text}`, "printavo");
    throw new Error(`Printavo API error: ${res.status}`);
  }

  const json = await res.json();
  if (json.errors) {
    log(`Printavo GraphQL errors: ${JSON.stringify(json.errors)}`, "printavo");
    throw new Error(json.errors[0]?.message || "GraphQL error");
  }
  return json.data;
}

export async function getStatuses() {
  const query = `
    query {
      statuses(first: 50) {
        nodes {
          id
          name
          color
        }
      }
    }
  `;
  const data = await graphqlQuery(query);
  return data.statuses?.nodes || [];
}

export async function getOrdersBySearch(searchValue: string, searchType: "email" | "company") {
  const gql = `
    query($searchQuery: String) {
      invoices(first: 15, sortOn: VISUAL_ID, sortDescending: true, query: $searchQuery) {
        nodes {
          id
          visualId
          nickname
          total
          dueAt
          customerDueAt
          createdAt
          publicUrl
          status {
            id
            name
            color
          }
          contact {
            id
            email
            fullName
            customer {
              companyName
            }
          }
          lineItemGroups(first: 5) {
            nodes {
              lineItems(first: 8) {
                nodes {
                  id
                  description
                  color
                  itemNumber
                  items
                  category { name }
                  product { brand description itemNumber }
                  sizes { size count }
                  mockups(first: 1) {
                    nodes {
                      fullImageUrl
                    }
                  }
                }
              }
              imprints(first: 1) {
                nodes {
                  mockups(first: 1) {
                    nodes {
                      fullImageUrl
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await graphqlQuery(gql, { searchQuery: searchValue });
  const allOrders = data.invoices?.nodes || [];

  const customerOrders = allOrders.filter((order: any) => {
    if (searchType === "email") {
      const contactEmail = order.contact?.email?.toLowerCase();
      return contactEmail === searchValue.toLowerCase();
    } else {
      const companyName = order.contact?.customer?.companyName?.toLowerCase() || "";
      return companyName.includes(searchValue.toLowerCase());
    }
  });

  return customerOrders.map((order: any) => {
    let mockupUrl: string | null = null;
    const groups = order.lineItemGroups?.nodes || [];

    const lineItems: any[] = [];
    for (const group of groups) {
      const imprints = group.imprints?.nodes || [];
      for (const imprint of imprints) {
        const mockups = imprint.mockups?.nodes || [];
        if (mockups.length > 0 && !mockupUrl) {
          mockupUrl = mockups[0].fullImageUrl;
        }
      }

      const groupItems = group.lineItems?.nodes || [];
      for (const li of groupItems) {
        const liMockups = li.mockups?.nodes || [];
        const liMockupUrl = liMockups.length > 0 ? liMockups[0].fullImageUrl : null;
        if (liMockupUrl && !mockupUrl) {
          mockupUrl = liMockupUrl;
        }

        const allSizes = (li.sizes || []).map((s: any) => ({ size: s.size, count: s.count || 0 }));

        lineItems.push({
          id: li.id,
          description: li.description || null,
          color: li.color || li.product?.color || null,
          itemNumber: li.itemNumber || li.product?.itemNumber || null,
          brand: li.product?.brand || null,
          productName: li.product?.description || null,
          category: li.category?.name || null,
          totalQty: li.items || 0,
          sizes: allSizes,
          mockupUrl: liMockupUrl,
        });
      }
    }

    const dedupedLineItems: any[] = [];
    const seenKeys = new Map<string, number>();
    for (const li of lineItems) {
      const key = [
        (li.itemNumber || "").toLowerCase().trim(),
        (li.color || "").toLowerCase().trim(),
        (li.description || li.productName || "").toLowerCase().trim(),
      ].join("|||");

      const existingIdx = seenKeys.get(key);
      if (existingIdx !== undefined && key !== "||||||") {
        const existing = dedupedLineItems[existingIdx];
        existing.totalQty = (existing.totalQty || 0) + (li.totalQty || 0);
        for (const s of (li.sizes || [])) {
          const match = (existing.sizes || []).find((es: any) => es.size === s.size);
          if (match) {
            match.count = (match.count || 0) + (s.count || 0);
          } else {
            existing.sizes = [...(existing.sizes || []), s];
          }
        }
        if (!existing.mockupUrl && li.mockupUrl) {
          existing.mockupUrl = li.mockupUrl;
        }
      } else {
        seenKeys.set(key, dedupedLineItems.length);
        dedupedLineItems.push({ ...li });
      }
    }

    return {
      id: order.id,
      visualId: order.visualId,
      orderNickname: order.nickname,
      customerName: order.contact?.fullName || null,
      customerEmail: order.contact?.email || null,
      customerCompany: order.contact?.customer?.companyName || null,
      status: order.status?.name || null,
      statusColor: order.status?.color || null,
      total: order.total,
      dueDate: order.dueAt,
      customerDueDate: order.customerDueAt,
      createdAt: order.createdAt,
      publicUrl: order.publicUrl || null,
      mockupUrl,
      lineItemCount: dedupedLineItems.length,
      orderTotalQty: dedupedLineItems.reduce((sum: number, li: any) => sum + (li.totalQty || 0), 0),
      lineItems: dedupedLineItems,
    };
  });
}
