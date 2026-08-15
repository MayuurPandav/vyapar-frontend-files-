import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { PlusCircle } from 'lucide-react';

const AddProductPage = () => {
  const navigate = useNavigate();
  const { addProduct } = useData();
  const [productData, setProductData] = useState({ productName: '', category: '', price: '', stock: '', minimumStock: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addProduct({
      ...productData,
      price: Number(productData.price) || 0,
      stock: Number(productData.stock) || 0,
      minimumStock: Number(productData.minimumStock) || 0,
    });
    navigate('/products');
  };

  const handleChange = (e) => {
    const value = ['price', 'stock', 'minimumStock'].includes(e.target.name) ? e.target.value : e.target.value;
    setProductData({ ...productData, [e.target.name]: value });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>Add Product</h2>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Create a new inventory item for your store.</p>
        </div>
        <button onClick={() => navigate('/products')} className="btn">
          Back to Products
        </button>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="form-row">
          <div className="fg">
            <label>Product Name</label>
            <input name="productName" onChange={handleChange} value={productData.productName} className="fi" required />
          </div>
          <div className="fg">
            <label>Category</label>
            <input name="category" onChange={handleChange} value={productData.category} className="fi" required />
          </div>
        </div>
        <div className="form-row">
          <div className="fg">
            <label>Price</label>
            <input type="number" name="price" min="0" onChange={handleChange} value={productData.price} className="fi" required />
          </div>
          <div className="fg">
            <label>Stock</label>
            <input type="number" name="stock" min="0" onChange={handleChange} value={productData.stock} className="fi" required />
          </div>
        </div>
        <div className="fg">
          <label>Minimum Stock</label>
          <input type="number" name="minimumStock" min="0" onChange={handleChange} value={productData.minimumStock} className="fi" required />
        </div>
        <div>
          <button type="submit" className="btn btn--primary">
            <PlusCircle style={{ width: 16, height: 16 }} /> Add Product
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProductPage;
