import { useEffect, useState } from 'react';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
import { categoriesAPI } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import './CategoryFilter.css';

const CategoryFilter = ({ selectedCategory, onSelectCategory }) => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesAPI.getAll();
        setCategories(response.data.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" variant="warning" />
      </div>
    );
  }

  return (
    <Container className="py-4">
      <Row className="g-2">
        <Col xs={12} className="text-center mb-3">
          <h5 className="text-muted">
            <i className="icon-tag me-2" aria-hidden="true"></i>
            Categorías
          </h5>
          <p className="text-muted small mb-0 mt-1 d-md-none">Desliza para ver las categorías</p>
        </Col>
        
        <Col xs={12}>
          <div className="category-filter-scroll">
            <button
              className={`category-btn btn btn-sm ${!selectedCategory ? 'btn-primary-custom' : 'btn-outline-custom'}`}
              onClick={() => {
                onSelectCategory(null);
                navigate('/');
              }}
            >
              Todas
            </button>
            {categories.map((category) => (
              <Link
                key={category._id}
                to={`/category/${category._id}`}
                className={`category-btn btn btn-sm text-decoration-none ${
                  selectedCategory === category._id ? 'btn-primary-custom' : 'btn-outline-custom'
                } ${selectedCategory !== category._id ? 'category-btn--hover-color' : ''}`}
                onClick={() => onSelectCategory(category._id)}
                style={
                  selectedCategory !== category._id
                    ? { '--category-color': category.color, borderColor: category.color, color: category.color }
                    : undefined
                }
              >
                {category.emoji} {category.name}
              </Link>
            ))}
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default CategoryFilter;
