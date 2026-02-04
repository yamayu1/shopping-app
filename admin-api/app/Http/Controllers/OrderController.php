<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class OrderController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:admin');
        $this->middleware('check.permission:manage_orders');
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $query = Order::with(['user:id,name,email', 'orderItems.product:id,name,sku']);

            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            if ($request->has('payment_status')) {
                $query->where('payment_status', $request->payment_status);
            }

            if ($request->has('payment_method')) {
                $query->where('payment_method', $request->payment_method);
            }

            if ($request->has('date_from')) {
                $query->where('created_at', '>=', $request->date_from);
            }

            if ($request->has('date_to')) {
                $query->where('created_at', '<=', $request->date_to);
            }

            if ($request->has('min_amount')) {
                $query->where('total_amount', '>=', $request->min_amount);
            }

            if ($request->has('max_amount')) {
                $query->where('total_amount', '<=', $request->max_amount);
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('order_number', 'like', "%{$search}%")
                      ->orWhereHas('user', function ($userQuery) use ($search) {
                          $userQuery->where('name', 'like', "%{$search}%")
                                   ->orWhere('email', 'like', "%{$search}%");
                      });
                });
            }

            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = in_array($request->get('sort_order', 'desc'), ['asc', 'desc']) ? $request->get('sort_order', 'desc') : 'desc';

            $allowedSortFields = ['id', 'order_number', 'status', 'total_amount', 'created_at', 'updated_at'];
            if (in_array($sortBy, $allowedSortFields)) {
                $query->orderBy($sortBy, $sortOrder);
            }

            $orders = $query->paginate($request->get('per_page', 15));

            return $this->successResponse('Orders retrieved successfully', [
                'orders' => $orders->items(),
                'pagination' => [
                    'current_page' => $orders->currentPage(),
                    'last_page' => $orders->lastPage(),
                    'per_page' => $orders->perPage(),
                    'total' => $orders->total(),
                ]
            ]);

        } catch (\Exception $e) {
            return $this->errorResponse('Failed to retrieve orders', $e->getMessage(), 500);
        }
    }
    public function show(string $orderNumber): JsonResponse
    {
        try {
            $order = Order::with([
                'user:id,name,email,phone',
                'orderItems.product:id,name,sku,images'
            ])->where('order_number', $orderNumber)->firstOrFail();

            return $this->successResponse('Order retrieved successfully', [
                'order' => $order
            ]);

        } catch (\Exception $e) {
            return $this->errorResponse('Order not found', $e->getMessage(), 404);
        }
    }
    public function updateStatus(Request $request, string $orderNumber): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'status' => 'required|string|in:' . implode(',', [
                    Order::STATUS_PENDING,
                    Order::STATUS_CONFIRMED,
                    Order::STATUS_PROCESSING,
                    Order::STATUS_SHIPPED,
                    Order::STATUS_DELIVERED,
                    Order::STATUS_CANCELLED,
                    Order::STATUS_REFUNDED
                ]),
                'notes' => 'nullable|string|max:1000',
                'tracking_number' => 'nullable|string|max:255',
            ]);

            if ($validator->fails()) {
                return $this->errorResponse('Validation failed', $validator->errors(), 422);
            }

            $order = Order::where('order_number', $orderNumber)->firstOrFail();
            $oldStatus = $order->status;
            $newStatus = $request->status;

            if (!$this->isValidStatusTransition($oldStatus, $newStatus)) {
                return $this->errorResponse("Invalid status transition from {$oldStatus} to {$newStatus}", null, 400);
            }

            DB::beginTransaction();

            try {
                $updateData = [
                    'status' => $newStatus,
                    'notes' => $request->notes,
                ];

                if ($newStatus === Order::STATUS_SHIPPED) {
                    $updateData['shipped_at'] = now();
                    if ($request->tracking_number) {
                        $updateData['tracking_number'] = $request->tracking_number;
                    }
                } elseif ($newStatus === Order::STATUS_DELIVERED) {
                    $updateData['delivered_at'] = now();
                    if (!$order->shipped_at) {
                        $updateData['shipped_at'] = now();
                    }
                } elseif ($newStatus === Order::STATUS_CANCELLED) {
                    $this->releaseOrderStock($order);
                }

                $order->update($updateData);

                $this->logStatusChange($order, $oldStatus, $newStatus, auth('admin')->id());

                DB::commit();

                $order->load(['user:id,name,email', 'orderItems.product:id,name,sku']);

                return $this->successResponse('Order status updated successfully', [
                    'order' => $order
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            return $this->errorResponse('Failed to update order status', $e->getMessage(), 500);
        }
    }
    public function updatePaymentStatus(Request $request, string $orderNumber): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'payment_status' => 'required|string|in:pending,paid,failed,refunded,partially_refunded',
                'payment_reference' => 'nullable|string|max:255',
                'notes' => 'nullable|string|max:1000',
            ]);

            if ($validator->fails()) {
                return $this->errorResponse('Validation failed', $validator->errors(), 422);
            }

            $order = Order::where('order_number', $orderNumber)->firstOrFail();

            $order->update([
                'payment_status' => $request->payment_status,
                'payment_reference' => $request->payment_reference,
                'notes' => $request->notes,
            ]);

            if ($request->payment_status === 'paid' && $order->status === Order::STATUS_PENDING) {
                $order->update(['status' => Order::STATUS_CONFIRMED]);
            }

            return $this->successResponse('Payment status updated successfully', [
                'order' => $order->only(['id', 'order_number', 'status', 'payment_status', 'payment_reference'])
            ]);

        } catch (\Exception $e) {
            return $this->errorResponse('Failed to update payment status', $e->getMessage(), 500);
        }
    }
    public function statistics(Request $request): JsonResponse
    {
        try {
            $dateFrom = $request->get('date_from', now()->subDays(30)->toDateString());
            $dateTo = $request->get('date_to', now()->toDateString());

            $baseQuery = Order::whereBetween('created_at', [$dateFrom, $dateTo]);

            $statistics = [
                'total_orders' => (clone $baseQuery)->count(),
                'total_revenue' => (clone $baseQuery)->sum('total_amount'),
                'average_order_value' => (clone $baseQuery)->avg('total_amount'),
                
                'orders_by_status' => [
                    'pending' => (clone $baseQuery)->where('status', Order::STATUS_PENDING)->count(),
                    'confirmed' => (clone $baseQuery)->where('status', Order::STATUS_CONFIRMED)->count(),
                    'processing' => (clone $baseQuery)->where('status', Order::STATUS_PROCESSING)->count(),
                    'shipped' => (clone $baseQuery)->where('status', Order::STATUS_SHIPPED)->count(),
                    'delivered' => (clone $baseQuery)->where('status', Order::STATUS_DELIVERED)->count(),
                    'cancelled' => (clone $baseQuery)->where('status', Order::STATUS_CANCELLED)->count(),
                    'refunded' => (clone $baseQuery)->where('status', Order::STATUS_REFUNDED)->count(),
                ],

                'payment_status' => [
                    'pending' => (clone $baseQuery)->where('payment_status', 'pending')->count(),
                    'paid' => (clone $baseQuery)->where('payment_status', 'paid')->count(),
                    'failed' => (clone $baseQuery)->where('payment_status', 'failed')->count(),
                    'refunded' => (clone $baseQuery)->where('payment_status', 'refunded')->count(),
                ],
            ];

            // 日別売上推移
            $revenueOverTime = (clone $baseQuery)
                ->select(DB::raw('DATE(created_at) as date'), DB::raw('COUNT(*) as orders'), DB::raw('SUM(total_amount) as revenue'))
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            // 売上上位の商品
            $topProducts = DB::table('order_items')
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->join('products', 'order_items.product_id', '=', 'products.id')
                ->whereBetween('orders.created_at', [$dateFrom, $dateTo])
                ->select('products.id', 'products.name', 'products.sku', 
                        DB::raw('SUM(order_items.quantity) as total_sold'),
                        DB::raw('SUM(order_items.total) as total_revenue'))
                ->groupBy('products.id', 'products.name', 'products.sku')
                ->orderBy('total_sold', 'desc')
                ->limit(10)
                ->get();

            return $this->successResponse('Order statistics retrieved successfully', [
                'statistics' => $statistics,
                'revenue_over_time' => $revenueOverTime,
                'top_products' => $topProducts,
                'date_range' => [
                    'from' => $dateFrom,
                    'to' => $dateTo
                ]
            ]);

        } catch (\Exception $e) {
            return $this->errorResponse('Failed to retrieve order statistics', $e->getMessage(), 500);
        }
    }
    public function bulkUpdateStatus(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'order_numbers' => 'required|array|min:1',
                'order_numbers.*' => 'required|string|exists:orders,order_number',
                'status' => 'required|string|in:' . implode(',', [
                    Order::STATUS_PENDING,
                    Order::STATUS_CONFIRMED,
                    Order::STATUS_PROCESSING,
                    Order::STATUS_SHIPPED,
                    Order::STATUS_DELIVERED,
                    Order::STATUS_CANCELLED,
                    Order::STATUS_REFUNDED
                ]),
                'notes' => 'nullable|string|max:1000',
            ]);

            if ($validator->fails()) {
                return $this->errorResponse('Validation failed', $validator->errors(), 422);
            }

            DB::beginTransaction();

            try {
                $updatedOrders = [];
                $failedOrders = [];

                foreach ($request->order_numbers as $orderNumber) {
                    try {
                        $order = Order::where('order_number', $orderNumber)->firstOrFail();
                        $oldStatus = $order->status;
                        $newStatus = $request->status;

                        if ($this->isValidStatusTransition($oldStatus, $newStatus)) {
                            $updateData = [
                                'status' => $newStatus,
                                'notes' => $request->notes,
                            ];

                            if ($newStatus === Order::STATUS_SHIPPED && !$order->shipped_at) {
                                $updateData['shipped_at'] = now();
                            } elseif ($newStatus === Order::STATUS_DELIVERED) {
                                $updateData['delivered_at'] = now();
                                if (!$order->shipped_at) {
                                    $updateData['shipped_at'] = now();
                                }
                            } elseif ($newStatus === Order::STATUS_CANCELLED) {
                                $this->releaseOrderStock($order);
                            }

                            $order->update($updateData);
                            $this->logStatusChange($order, $oldStatus, $newStatus, auth('admin')->id());
                            
                            $updatedOrders[] = $orderNumber;
                        } else {
                            $failedOrders[] = [
                                'order_number' => $orderNumber,
                                'reason' => "Invalid status transition from {$oldStatus} to {$newStatus}"
                            ];
                        }
                    } catch (\Exception $e) {
                        $failedOrders[] = [
                            'order_number' => $orderNumber,
                            'reason' => $e->getMessage()
                        ];
                    }
                }

                DB::commit();

                return $this->successResponse('Bulk status update completed', [
                    'updated_orders' => $updatedOrders,
                    'failed_orders' => $failedOrders,
                    'total_updated' => count($updatedOrders),
                    'total_failed' => count($failedOrders)
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            return $this->errorResponse('Failed to bulk update order status', $e->getMessage(), 500);
        }
    }
    public function export(Request $request)
    {
        try {
            $query = Order::with(['user:id,name,email', 'orderItems.product:id,name,sku']);

            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            if ($request->has('date_from')) {
                $query->where('created_at', '>=', $request->date_from);
            }

            if ($request->has('date_to')) {
                $query->where('created_at', '<=', $request->date_to);
            }

            $orders = $query->orderBy('created_at', 'desc')->get();

            $filename = 'orders_export_' . now()->format('Y-m-d_H-i-s') . '.csv';
            $headers = [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            ];

            $callback = function() use ($orders) {
                $file = fopen('php://output', 'w');
                
                fputcsv($file, [
                    'Order Number',
                    'Customer Name',
                    'Customer Email',
                    'Status',
                    'Payment Status',
                    'Total Amount',
                    'Items Count',
                    'Created At',
                    'Updated At'
                ]);

                foreach ($orders as $order) {
                    fputcsv($file, [
                        $order->order_number,
                        $order->user->name ?? 'N/A',
                        $order->user->email ?? 'N/A',
                        $order->status,
                        $order->payment_status,
                        $order->total_amount,
                        $order->orderItems->count(),
                        $order->created_at->toDateTimeString(),
                        $order->updated_at->toDateTimeString(),
                    ]);
                }

                fclose($file);
            };

            return response()->stream($callback, 200, $headers);

        } catch (\Exception $e) {
            return $this->errorResponse('Failed to export orders', $e->getMessage(), 500);
        }
    }

    private function isValidStatusTransition(string $from, string $to): bool
    {
        $transitions = [
            Order::STATUS_PENDING => [Order::STATUS_CONFIRMED, Order::STATUS_CANCELLED],
            Order::STATUS_CONFIRMED => [Order::STATUS_PROCESSING, Order::STATUS_CANCELLED],
            Order::STATUS_PROCESSING => [Order::STATUS_SHIPPED, Order::STATUS_CANCELLED],
            Order::STATUS_SHIPPED => [Order::STATUS_DELIVERED],
            Order::STATUS_DELIVERED => [Order::STATUS_REFUNDED],
            Order::STATUS_CANCELLED => [],
            Order::STATUS_REFUNDED => [],
        ];

        return in_array($to, $transitions[$from] ?? []);
    }

    private function releaseOrderStock(Order $order): void
    {
        foreach ($order->orderItems as $item) {
            $product = $item->product;
            if ($product) {
                $product->releaseStock($item->quantity);
            }
        }
    }

    private function logStatusChange(Order $order, string $oldStatus, string $newStatus, int $adminId): void
    {
        $logMessage = "Status changed from {$oldStatus} to {$newStatus} by admin ID {$adminId} at " . now()->toDateTimeString();
        
        $existingNotes = $order->notes ? $order->notes . "\n" : '';
        $order->update(['notes' => $existingNotes . $logMessage]);
    }

}