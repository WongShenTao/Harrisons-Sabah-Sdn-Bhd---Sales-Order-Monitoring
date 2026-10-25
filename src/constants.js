// Everything we know about the API's data lives here, so the rest of the app stays simple.

// Table columns. `key` is the real field name in the API response.
// `sortable` columns are the ones the API accepts for ?sort= (see /meta).
export const COLUMNS = [
  { key: 'SalesId', label: 'Order no.', sortable: true, defaultOrder: 'asc' },
  { key: 'SalesName', label: 'Customer', sortable: false },
  { key: 'InventSiteId', label: 'Branch', sortable: true, defaultOrder: 'asc' },
  { key: 'CreatedDateTime1', label: 'Order date', sortable: true, defaultOrder: 'desc' },
  { key: 'SalesStatus', label: 'Status', sortable: true, defaultOrder: 'asc' },
  { key: 'HAR_TotalSOAmount', label: 'Amount', sortable: true, defaultOrder: 'desc', numeric: true },
];

// The four SalesStatus values the API returns, mapped to a colour class.
export const STATUS_CLASS = {
  'Open order': 'open',
  Invoiced: 'done',
  Delivered: 'done',
  Cancelled: 'cancelled',
};

// Fields shown in the order detail dialog (label + how to format).
export const DETAIL_FIELDS = [
  ['SalesId', 'Order no.'],
  ['SalesName', 'Customer'],
  ['CustAccount', 'Customer account'],
  ['CustomerRef', 'Customer reference'],
  ['InventSiteId', 'Branch'],
  ['SalesStatus', 'Status'],
  ['DocumentStatus', 'Document status'],
  ['DOT_ShowOrderStatus', 'Displayed status'],
  ['DOT_ValidationStatus', 'Validation'],
  ['ReleaseStatus', 'Release status'],
  ['MCROrderStopped', 'Order stopped'],
  ['SalesType', 'Order type'],
  ['SalesGroup', 'Sales group'],
  ['SalesTaker', 'Sales taker'],
  ['DOT_ItemGroupId', 'Item group'],
  ['PurchOrderFormNum', 'Purchase order form'],
  ['SalesDistrictDescription', 'Sales district'],
  ['HAR_SalesDeliveryDistrictId', 'Delivery district ID'],
  ['HAR_DeliveryDistrictDescription', 'Delivery district'],
  ['CreatedDateTime1', 'Created', 'datetime'],
  ['ModifiedDateTime1', 'Modified', 'datetime'],
  ['ShippingDateRequested', 'Requested shipping date', 'date'],
  ['HAR_TotalSOAmount', 'Total amount', 'money'],
  ['HAR_InvoicedAmount', 'Invoiced amount', 'money'],
  ['HAR_BalanceAmount', 'Balance amount', 'money'],
  ['DOT_SONotes', 'Notes'],
  ['DOT_SFANotes', 'SFA notes'],
];
