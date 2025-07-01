import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase-client';
import { getServerSession } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceSupabaseClient();

    // Fetch all products with detailed information
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    // Check table existence for each product
    const productsWithTableStatus = []
    
    for (const product of products || []) {
      let tableExists = false
      let recordCount = 0
      
      try {
        const { count, error: countError } = await supabase
          .from(product.table_name)
          .select('*', { count: 'exact', head: true })
        
        if (!countError) {
          tableExists = true
          recordCount = count || 0
        }
      } catch (e) {
        // Table doesn't exist
        tableExists = false
      }
      
      productsWithTableStatus.push({
        ...product,
        tableExists,
        recordCount
      })
    }

    return NextResponse.json({
      success: true,
      products: productsWithTableStatus,
      message: `Found ${products?.length || 0} products`
    });

  } catch (error) {
    console.error('Error in products manage API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('id')
    const initials = searchParams.get('initials')
    const forceDelete = searchParams.get('force') === 'true'

    if (!productId && !initials) {
      return NextResponse.json(
        { error: 'Product ID or initials is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceSupabaseClient();

    // Find the product
    let query = supabase.from('products').select('*')
    
    if (productId) {
      query = query.eq('id', productId)
    } else if (initials) {
      query = query.eq('initials', initials.toUpperCase())
    }
    
    const { data: product, error: fetchError } = await query.single()

    if (fetchError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if table has data (unless force delete)
    if (!forceDelete) {
      try {
        const { count } = await supabase
          .from(product.table_name)
          .select('*', { count: 'exact', head: true })
        
        if (count && count > 0) {
          return NextResponse.json({
            error: `Product "${product.name}" has ${count} records. Use force=true to delete anyway.`,
            recordCount: count,
            tableName: product.table_name
          }, { status: 400 })
        }
      } catch (e) {
        // Table doesn't exist, safe to delete
      }
    }

    // Delete the product metadata
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', product.id)

    if (deleteError) {
      console.error('Error deleting product:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete product' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Product "${product.name}" (${product.initials}) deleted successfully`,
      deletedProduct: product
    });

  } catch (error) {
    console.error('Error in product delete API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 