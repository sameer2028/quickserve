import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCategories,
  fetchMenuItems,
  createCategory,
  updateCategory,
  deleteCategory,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  uploadMenuItemImage,
} from '../store/menuSlice';
import { fetchMyRestaurant } from '../store/dashboardSlice';
import {
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  UtensilsCrossed,
  X,
  Check,
  Leaf,
  Drumstick,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Category / Item Modal ──────────────────────────────
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

const MenuManagement = () => {
  const dispatch = useDispatch();
  const { categories, items, isLoading } = useSelector((state) => state.menu);
  const { restaurant } = useSelector((state) => state.dashboard);

  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [categoryModal, setCategoryModal] = useState({ open: false, editing: null });
  const [itemModal, setItemModal] = useState({ open: false, editing: null, categoryId: null });
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: '',
    foodType: 'veg',
    preparationTime: '15',
    category: '',
  });
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    dispatch(fetchMyRestaurant());
  }, [dispatch]);

  useEffect(() => {
    if (restaurant?._id) {
      dispatch(fetchCategories(restaurant._id));
      dispatch(fetchMenuItems(restaurant._id));
    }
  }, [dispatch, restaurant?._id]);

  // ─── Expand / Collapse ─────────────────────────────────
  const toggleCategory = (id) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ─── Category CRUD ─────────────────────────────────────
  const openCategoryModal = (cat = null) => {
    if (cat) {
      setCategoryForm({ name: cat.name, description: cat.description || '' });
      setCategoryModal({ open: true, editing: cat });
    } else {
      setCategoryForm({ name: '', description: '' });
      setCategoryModal({ open: true, editing: null });
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (categoryModal.editing) {
        await dispatch(updateCategory({ id: categoryModal.editing._id, data: categoryForm })).unwrap();
        toast.success('Category updated');
      } else {
        await dispatch(createCategory(categoryForm)).unwrap();
        toast.success('Category created');
      }
      setCategoryModal({ open: false, editing: null });
    } catch (err) {
      toast.error(err || 'Failed');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category and all its items?')) return;
    try {
      await dispatch(deleteCategory(id)).unwrap();
      toast.success('Category deleted');
    } catch (err) {
      toast.error(err || 'Failed');
    }
  };

  // ─── Item CRUD ─────────────────────────────────────────
  const openItemModal = (categoryId, item = null) => {
    setImageFile(null);
    if (item) {
      setItemForm({
        name: item.name,
        description: item.description || '',
        price: String(item.price),
        foodType: item.foodType || 'veg',
        preparationTime: String(item.preparationTime || 15),
        category: item.category?._id || item.category || categoryId,
      });
      setItemModal({ open: true, editing: item, categoryId });
    } else {
      setItemForm({ name: '', description: '', price: '', foodType: 'veg', preparationTime: '15', category: categoryId });
      setItemModal({ open: true, editing: null, categoryId });
    }
  };

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    const data = { ...itemForm, price: parseFloat(itemForm.price), preparationTime: parseInt(itemForm.preparationTime) };
    try {
      let savedItem;
      if (itemModal.editing) {
        savedItem = await dispatch(updateMenuItem({ id: itemModal.editing._id, data })).unwrap();
        toast.success('Item updated');
      } else {
        savedItem = await dispatch(createMenuItem(data)).unwrap();
        toast.success('Item created');
      }

      if (imageFile && savedItem) {
        toast.loading('Uploading image...', { id: 'imageUpload' });
        await dispatch(uploadMenuItemImage({ id: savedItem._id, file: imageFile })).unwrap();
        toast.success('Image uploaded successfully', { id: 'imageUpload' });
      }

      setItemModal({ open: false, editing: null, categoryId: null });
      // Refresh items
      if (restaurant?._id) dispatch(fetchMenuItems(restaurant._id));
    } catch (err) {
      toast.dismiss('imageUpload');
      toast.error(err || 'Failed');
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Delete this menu item?')) return;
    try {
      await dispatch(deleteMenuItem(id)).unwrap();
      toast.success('Item deleted');
    } catch (err) {
      toast.error(err || 'Failed');
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      await dispatch(updateMenuItem({ id: item._id, data: { isAvailable: !item.isAvailable } })).unwrap();
      toast.success(`${item.name} ${!item.isAvailable ? 'enabled' : 'disabled'}`);
      if (restaurant?._id) dispatch(fetchMenuItems(restaurant._id));
    } catch (err) {
      toast.error(err || 'Failed');
    }
  };

  // ─── Group items by category ───────────────────────────
  const getItemsByCategory = (catId) => items.filter((item) => {
    const itemCat = item.category?._id || item.category;
    return itemCat === catId;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Menu Management</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your restaurant's menu categories and items.
          </p>
        </div>
        <button onClick={() => openCategoryModal()} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-40 mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-64"></div>
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="card p-12 text-center">
          <UtensilsCrossed className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No menu categories yet</h3>
          <p className="text-gray-500 mb-6">Start by creating your first category, then add items to it.</p>
          <button onClick={() => openCategoryModal()} className="btn-primary">
            Create First Category
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => {
            const catItems = getItemsByCategory(cat._id);
            const isExpanded = expandedCategories.has(cat._id);

            return (
              <div key={cat._id} className="card overflow-hidden">
                {/* Category Header */}
                <div
                  className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                  onClick={() => toggleCategory(cat._id)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{cat.name}</h3>
                      {cat.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{cat.description}</p>}
                    </div>
                    <span className="ml-2 text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                      {catItems.length} items
                    </span>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openItemModal(cat._id)}
                      className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Add item"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openCategoryModal(cat)}
                      className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit category"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat._id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete category"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Items List */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-slate-700">
                    {catItems.length === 0 ? (
                      <div className="px-6 py-8 text-center text-gray-400 text-sm">
                        No items in this category.{' '}
                        <button onClick={() => openItemModal(cat._id)} className="text-primary-600 hover:underline">
                          Add one
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
                        {catItems.map((item) => (
                          <div key={item._id} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {/* Image Thumbnail */}
                              {item.images && item.images.length > 0 ? (
                                <img src={item.images[0].url} alt={item.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-gray-100 dark:border-slate-600" />
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-gray-50 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 border border-gray-100 dark:border-slate-600">
                                  <UtensilsCrossed className="w-5 h-5 text-gray-300 dark:text-gray-500" />
                                </div>
                              )}
                              {/* Veg / Non-veg indicator */}
                              <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                                item.foodType === 'veg' ? 'border-green-500' : 'border-red-500'
                              }`}>
                                <div className={`w-2.5 h-2.5 rounded-full ${
                                  item.foodType === 'veg' ? 'bg-green-500' : 'bg-red-500'
                                }`} />
                              </div>
                              <div className="min-w-0">
                                <p className={`font-medium text-sm ${item.isAvailable !== false ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500 line-through'}`}>
                                  {item.name}
                                </p>
                                {item.description && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-sm">{item.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-4 ml-4">
                              <span className="text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">₹{item.price}</span>
                              <span className="text-xs text-gray-400 whitespace-nowrap">{item.preparationTime} min</span>
                              {/* Toggle */}
                              <button
                                onClick={() => handleToggleAvailability(item)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  item.isAvailable !== false ? 'bg-primary-600' : 'bg-gray-300'
                                }`}
                              >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                                  item.isAvailable !== false ? 'translate-x-6' : 'translate-x-1'
                                }`} />
                              </button>
                              {/* Edit / Delete */}
                              <button
                                onClick={() => openItemModal(cat._id, item)}
                                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item._id)}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Category Modal ───────────────────────────────── */}
      <Modal
        isOpen={categoryModal.open}
        onClose={() => setCategoryModal({ open: false, editing: null })}
        title={categoryModal.editing ? 'Edit Category' : 'New Category'}
      >
        <form onSubmit={handleCategorySubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
            <input
              type="text"
              required
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              className="input-field"
              placeholder="e.g. Main Course, Appetizers"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              className="input-field"
              rows="2"
              placeholder="Optional description"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setCategoryModal({ open: false, editing: null })} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {categoryModal.editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── Item Modal ───────────────────────────────────── */}
      <Modal
        isOpen={itemModal.open}
        onClose={() => setItemModal({ open: false, editing: null, categoryId: null })}
        title={itemModal.editing ? 'Edit Menu Item' : 'New Menu Item'}
      >
        <form onSubmit={handleItemSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
            <input
              type="text"
              required
              value={itemForm.name}
              onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
              className="input-field"
              placeholder="e.g. Paneer Tikka"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={itemForm.description}
              onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
              className="input-field"
              rows="2"
              placeholder="Describe the dish"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
              <input
                type="number"
                required
                min="0"
                step="1"
                value={itemForm.price}
                onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                className="input-field"
                placeholder="250"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prep Time (min)</label>
              <input
                type="number"
                min="1"
                value={itemForm.preparationTime}
                onChange={(e) => setItemForm({ ...itemForm, preparationTime: e.target.value })}
                className="input-field"
                placeholder="15"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Food Type</label>
            <div className="flex gap-4">
              <label className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                itemForm.foodType === 'veg' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="foodType"
                  value="veg"
                  checked={itemForm.foodType === 'veg'}
                  onChange={(e) => setItemForm({ ...itemForm, foodType: e.target.value })}
                  className="sr-only"
                />
                <Leaf className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Veg</span>
              </label>
              <label className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                itemForm.foodType === 'non_veg' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="foodType"
                  value="non_veg"
                  checked={itemForm.foodType === 'non_veg'}
                  onChange={(e) => setItemForm({ ...itemForm, foodType: e.target.value })}
                  className="sr-only"
                />
                <Drumstick className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Non-Veg</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setItemModal({ open: false, editing: null, categoryId: null })} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {itemModal.editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MenuManagement;
