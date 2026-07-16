# Import Cost Management System (Peru) - Product Requirements Document (PRD)

## Goal

Build a professional web application that replaces Excel for calculating
the complete landed cost of imported products into Peru.

The application must be generic enough to support any imported product,
while initially targeting PVC UV Boards imported from China.

The system should be modular, scalable, and designed for long-term
business use.

------------------------------------------------------------------------

# Core Principles

-   Single source of truth.
-   No duplicated data.
-   Automatic calculations whenever possible.
-   Editable fields clearly separated from calculated fields.
-   Modern dashboard UI.
-   Mobile-friendly.
-   Multi-import history.
-   Future-ready for ERP integration.

------------------------------------------------------------------------

# Tech Recommendations

-   Frontend: React + TypeScript + TailwindCSS
-   Backend: Node.js (NestJS or Express)
-   Database: PostgreSQL
-   ORM: Prisma
-   Charts: Recharts
-   Authentication: Clerk or Auth.js
-   Deployment: Vercel + Railway/Supabase

------------------------------------------------------------------------

# Modules

## 1. Dashboard

Display KPI cards:

-   Total FOB
-   Logistics Cost
-   Customs Taxes
-   Total Landed Cost
-   Average Cost per Unit
-   Average Cost per m²
-   Suggested Selling Price
-   Gross Margin

Charts:

-   Cost Breakdown
-   Import History
-   Logistics vs Taxes
-   Cost Evolution

------------------------------------------------------------------------

## 2. Product Catalog

Each product contains:

-   SKU
-   Product Name
-   Category
-   Thickness
-   Finish (1 Side UV / 2 Side UV)
-   Length
-   Width
-   Area (m²)
-   Weight
-   Unit FOB Price
-   Supplier

Support unlimited products.

------------------------------------------------------------------------

## 3. Suppliers

Store:

-   Company
-   Contact
-   Country
-   Currency
-   Payment Terms
-   Incoterms
-   Notes

------------------------------------------------------------------------

## 4. Purchase Order

Editable:

-   Supplier
-   Product
-   Quantity

Automatically retrieve:

-   Unit Price
-   Area
-   Weight

Automatically calculate:

-   Line Total
-   Total Quantity
-   Total Weight
-   Total Area
-   FOB Total

FOB MUST NEVER be manually entered.

------------------------------------------------------------------------

## 5. Logistics

Sections:

### International

-   Ocean Freight
-   Insurance
-   BL Service
-   Other Charges

Subtotal

### Destination

-   Deconsolidation
-   Warehouse
-   Handling
-   Customs Release
-   Monitoring
-   Port Charges
-   Other Charges

Subtotal

### Customs Broker

-   Brokerage
-   Customs Processing
-   Local Delivery
-   Miscellaneous

Subtotal

Automatically calculate:

Total Logistics Cost

------------------------------------------------------------------------

## 6. Customs (SUNAT)

User enters:

-   Exchange Rate
-   Ad Valorem %
-   IGV %
-   IPM %
-   Perception %

System automatically calculates:

-   CIF
-   Tax Base
-   Ad Valorem
-   IGV
-   IPM
-   Perception
-   Total SUNAT Taxes

------------------------------------------------------------------------

## 7. Cost Allocation

Allow multiple allocation methods:

-   By Quantity
-   By Weight
-   By Area (m²)
-   By FOB Value

Each product receives proportional logistics and tax costs.

Final table:

-   Product
-   FOB
-   Logistics Allocation
-   Tax Allocation
-   Final Landed Cost
-   Cost per Unit
-   Cost per m²

------------------------------------------------------------------------

## 8. Pricing

User selects desired margin.

Generate automatically:

-   20%
-   25%
-   30%
-   35%
-   40%
-   50%

Display:

-   Selling Price
-   Gross Profit
-   Margin

------------------------------------------------------------------------

## 9. Import History

Store every import.

Each record includes:

-   Date
-   Supplier
-   FOB
-   Logistics
-   Taxes
-   Total Cost

Allow comparison between imports.

------------------------------------------------------------------------

## 10. Scenario Simulator

User changes:

-   Exchange Rate
-   Freight
-   Insurance
-   Tax Rates
-   Quantities

Everything recalculates instantly.

------------------------------------------------------------------------

# Database Entities

-   Users
-   Suppliers
-   Products
-   PurchaseOrders
-   PurchaseOrderItems
-   LogisticsCosts
-   TaxProfiles
-   Imports
-   CostAllocations
-   PricingProfiles

------------------------------------------------------------------------

# UX Requirements

-   Modern ERP-style interface
-   Dark and Light themes
-   Responsive
-   Keyboard friendly
-   Editable fields highlighted
-   Read-only calculated fields
-   Confirmation dialogs before deletion

------------------------------------------------------------------------

# Nice-to-Have Features

-   PDF export
-   Excel export
-   Import from Excel
-   Barcode support
-   Audit log
-   Multi-company support
-   Multi-currency
-   Attach supplier quotations
-   AI insights (future)

------------------------------------------------------------------------

# Future Integrations

-   SUNAT APIs
-   Freight Forwarders
-   ERP systems
-   Accounting software
-   Inventory management

------------------------------------------------------------------------

# Success Criteria

The application should completely replace manual Excel workflows and
provide:

-   Accurate landed cost calculations
-   Faster quotation process
-   Reusable product catalog
-   Historical import tracking
-   Executive dashboards
-   Scalable architecture suitable for years of business growth.
