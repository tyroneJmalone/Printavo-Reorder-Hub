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

export async function getOrdersByCustomerEmail(email: string) {
  const gql = `
    query($searchQuery: String) {
      invoices(first: 25, sortOn: VISUAL_ID, sortDescending: true, query: $searchQuery) {
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
          lineItemGroups(first: 3) {
            nodes {
              lineItems(first: 3) {
                nodes {
                  id
                  mockups(first: 1) {
                    nodes {
                      id
                      fullImageUrl
                    }
                  }
                }
              }
              imprints(first: 3) {
                nodes {
                  id
                  mockups(first: 1) {
                    nodes {
                      id
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

  const data = await graphqlQuery(gql, { searchQuery: email });
  const allOrders = data.invoices?.nodes || [];

  const customerOrders = allOrders.filter((order: any) => {
    const contactEmail = order.contact?.email?.toLowerCase();
    return contactEmail === email.toLowerCase();
  });

  return customerOrders.map((order: any) => {
    let mockupUrl: string | null = null;
    const groups = order.lineItemGroups?.nodes || [];
    for (const group of groups) {
      const imprints = group.imprints?.nodes || [];
      for (const imprint of imprints) {
        const mockups = imprint.mockups?.nodes || [];
        if (mockups.length > 0) {
          mockupUrl = mockups[0].fullImageUrl;
          break;
        }
      }
      if (mockupUrl) break;

      const lineItems = group.lineItems?.nodes || [];
      for (const li of lineItems) {
        const mockups = li.mockups?.nodes || [];
        if (mockups.length > 0) {
          mockupUrl = mockups[0].fullImageUrl;
          break;
        }
      }
      if (mockupUrl) break;
    }

    let lineItemCount = 0;
    for (const group of groups) {
      lineItemCount += (group.lineItems?.nodes?.length || 0);
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
      lineItemCount,
    };
  });
}
