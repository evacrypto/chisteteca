import { useEffect, useState } from 'react';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
import { categoriesAPI } from '../services/api';
import { Link } from 'react-router-dom';

const CategoryFilter = ({ selectedCategory, onSelectCategory }) => {
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
        </Col>
        
        <Col xs={12} className="text-center">
          <button
            className={`btn btn-sm me-1 mb-1 ${!selectedCategory ? 'btn-primary-custom' : 'btn-outline-custom'}`}
            onClick={() => onSelectCategory(null)}
          >
            Todas
          </button>
          
          {categories.map((category) => (
            <Link
              key={category._id}
              to={`/category/${category._id}`}
              className="text-decoration-none"
            >
              <button
                className={`btn btn-sm me-1 mb-1 ${
                  selectedCategory === category._id ? 'btn-primary-custom' : 'btn-outline-custom'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  onSelectCategory(category._id);
                }}
                style={{
                  borderColor: category.color,
                  color: category.color
                }}
              >
                {category.emoji} {category.name}
              </button>
            </Link>
          ))}
        </Col>
      </Row>
    </Container>
  );
};

export default CategoryFilter;
