import React, { useEffect, useState, useRef, useLayoutEffect } from 'react'
import './styles/LibraryPage.css'
import axios from 'axios';
import API_CONFIG from '../config/api.js';
import useAuthHeader from 'react-auth-kit/hooks/useAuthHeader';
import { useNavigate, useSearchParams, createSearchParams } from "react-router-dom";
import { Clock, Eye, Plus, Star, ThumbsUp, TrendingUp, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';


const LibraryPage = () => {
  const [resources, setResources] = useState([]);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  
  const [searchParams, setSearchParams] = useSearchParams();
  
  const stackId = searchParams.get('stackId');
  const [stackResourceIds, setStackResourceIds] = useState(new Set());
  const isStackMode = !!stackId;

  const authHeader = useAuthHeader();
  const authUser = useAuthUser();
  const navigate = useNavigate();

  const menuTimeoutRef = useRef(null);
  const scrollRestorationRef = useRef(0);
  const isRestoringScrollRef = useRef(false);

  const [pagination, setPagination] = useState({
      currentPage: 1,
      totalPages: 1,
      totalItems: 0
  });

  const fetchResources = (paramsObj) => {
    if(!authHeader) return;
    const token = authHeader.split(' ')[1];

    const queryParams = {
        page: paramsObj.page || 1,
        page_size: 10,
        ...paramsObj
    };

    axios.get(`${API_CONFIG.BASE_URL}/resource/search`, {
        headers: { 'Authorization': token },
        params: queryParams
    })
      .then(response => {
          setResources(response.data.resources);
          setPagination({
              currentPage: response.data.currentPage,
              totalPages: response.data.totalPages,
              totalItems: response.data.totalItems
          });
      })
      .catch(error => {
          console.error("Search error:", error);
      });
  };

  useEffect(() => {
    const currentParams = Object.fromEntries([...searchParams]);
    
    const savedScroll = sessionStorage.getItem('libraryScrollY');
    if (savedScroll) {
        scrollRestorationRef.current = parseInt(savedScroll, 10);
        isRestoringScrollRef.current = true;
        sessionStorage.removeItem('libraryScrollY');
    }

    fetchResources(currentParams);
  }, [searchParams, authHeader]); 

  
  useLayoutEffect(() => {
      if (isRestoringScrollRef.current && resources.length > 0) {
          window.scrollTo(0, scrollRestorationRef.current);
          isRestoringScrollRef.current = false;
      }
  }, [resources]);

  // Stack mode logic
  useEffect(() => {
    if (isStackMode && authHeader) {
        const token = authHeader.split(' ')[1];
        axios.get(`${API_CONFIG.BASE_URL}/stack/getResourceIds/${stackId}`, {
            headers: { 'Authorization': token }
        })
        .then(res => {
            setStackResourceIds(new Set(res.data));
        })
        .catch(err => console.error("Failed to load stack resources:", err));
    }
  }, [isStackMode, stackId, authHeader]);

  // Stack toggle handlers
  const handleToggleStackResource = async (resourceId, isAdded) => {
      const token = authHeader.split(' ')[1];
      const url = `${API_CONFIG.BASE_URL}/stack/${isAdded ? 'removeResource' : 'addResource'}/${stackId}/${resourceId}`;
      const method = isAdded ? 'delete' : 'post';

      try {
          const newSet = new Set(stackResourceIds);
          if (isAdded) newSet.delete(resourceId);
          else newSet.add(resourceId);
          setStackResourceIds(newSet);

          await axios({ method, url, headers: { 'Authorization': token } });
      } catch (error) {
          console.error("Failed to toggle resource in stack", error);
          const newSet = new Set(stackResourceIds);
          if (isAdded) newSet.add(resourceId);
          else newSet.delete(resourceId);
          setStackResourceIds(newSet);
          alert("Помилка оновлення стеку");
      }
  };

  const handleFinishStack = () => {
      navigate(`/library/mystacks/${authUser?.user_Id}?openEdit=true&stackId=${stackId}`);
  };

  // Menu handlers
  useEffect(() => {
    return () => {
      if (menuTimeoutRef.current) clearTimeout(menuTimeoutRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (menuTimeoutRef.current) {
        clearTimeout(menuTimeoutRef.current);
        menuTimeoutRef.current = null;
    }
    setIsMenuVisible(true);
  };

  const handleMouseLeave = () => {
    menuTimeoutRef.current = setTimeout(() => {
      setIsMenuVisible(false);
    }, 200);
  };

  const handlePageChange = (newPage) => {
      if (newPage >= 1 && newPage <= pagination.totalPages) {
          const newParams = new URLSearchParams(searchParams);
          newParams.set('page', newPage);
          setSearchParams(newParams);
          window.scrollTo({ top: 0, behavior: 'smooth' });
      }
  };

  const handleNavigateToResource = (resourceId) => {
      sessionStorage.setItem('libraryScrollY', window.scrollY.toString());
      navigate(`/library/resource/${resourceId}`);
  };

  return (
    <div className='library-page'>
        {/* Header */}
        <div className='library-header-wrapper'>
            <div></div>
            <h1 className='library-page__heading'>
                {isStackMode ? 'Наповнення стеку' : 'Бібліотека ресурсів'}
            </h1>
            <div className='library-header-actions'>
                {!isStackMode && (
                    <>
                        <div className='header-icon-btn' title="Рейтинги">
                            <TrendingUp size={24} />
                        </div>
                        <div 
                            className='header-icon-btn'
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                        >
                            <Plus size={24} />
                            
                            {isMenuVisible && (
                                <div className='header-dropdown-menu'>
                                    <div 
                                        className='header-menu-item'
                                        onClick={() => navigate(`/library/myresources/${authUser?.user_Id}`)}
                                    >
                                        Мої ресурси
                                    </div>
                                    <div 
                                        className='header-menu-item'
                                        onClick={() => navigate(`/library/mystacks/${authUser?.user_Id}`)}
                                    >
                                        Мої стеки
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>

            <SearchPanelComponent />

        <div className='library-page__search-results'>
          <div className='search-results__heading'>
            Знайдено {pagination.totalItems} результатів:
          </div>
          
          <div className='search-results__list'>
            {resources?.map((resource) => (
              <ResourceSearchResultComponent 
                key={resource.resource_Id} 
                resource={resource}
                stackMode={isStackMode}
                isInStack={stackResourceIds.has(resource.resource_Id)}
                onToggleStack={handleToggleStackResource}
                onNavigate={handleNavigateToResource}
              />
            ))}
            {resources.length === 0 && <p style={{textAlign:'center', color:'#666', marginTop:'20px'}}>Нічого не знайдено</p>}
          </div>

          {pagination.totalItems > 0 && (
              <div className="pagination-container">
                  <button 
                    className="pagination-arrow" 
                    disabled={pagination.currentPage === 1}
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                  >
                      <ChevronLeft size={24} />
                  </button>
                  
                  <span className="pagination-info">
                      {pagination.currentPage} / {pagination.totalPages}
                  </span>
                  
                  <button 
                    className="pagination-arrow" 
                    disabled={pagination.currentPage === pagination.totalPages}
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                  >
                      <ChevronRight size={24} />
                  </button>
              </div>
          )}
        </div>

        {isStackMode && (
            <div className="stack-mode-footer">
                <button className="btn-finish-stack" onClick={handleFinishStack}>
                    Завершити
                </button>
            </div>
        )}
    </div>
  )
}

const ResourceSearchResultComponent = ({ resource, stackMode, isInStack, onToggleStack, onNavigate }) => {
  const authHeader = useAuthHeader();

  const {
    resource_Id,
    name,
    origination_date,
    likes_cache,
    views_cache,
    is_recommended,
    User,
    Ratings,
    DevelopmentDirections,
    InteractionUserResources
  } = resource;

  const interaction = InteractionUserResources?.[0];
  const [isFav, setIsFav] = useState(interaction?.is_in_favourites || false);
  const [isWatchLater, setIsWatchLater] = useState(interaction?.is_in_view_later || false);

  const handleInteraction = async (e, field, currentState, setState) => {
    e.stopPropagation();
    if (!authHeader) return;

    const token = authHeader.split(' ')[1];
    const newState = !currentState;

    setState(newState);

    try {
        await axios.post(`${API_CONFIG.BASE_URL}/interactionUserResource/createOrUpdate`, {
            resource_Id,
            [field]: newState
        }, {
            headers: { 'Authorization': token }
        });
    } catch (error) {
        console.error(`Failed to update ${field}:`, error);
        setState(currentState);
    }
  };

  return (
    <div className={`resource-card ${stackMode && isInStack ? 'in-stack' : ''}`}>
      <div className="resource-card__header">
        <h3 className="resource-card__title">
          {name} {is_recommended && <span className="resource-card__verified">✔</span>}
        </h3>
        {Ratings && Ratings.length > 0 && (
          <div className="resource-card__top-tag">
            {Ratings.map(rating => (
                <div key={rating.rating_Id}>
                    {`#${rating.RatingResource.rating_position} у ${rating.name}`}
                </div>
            ))}
          </div>
        )}
      </div>

      <div className="resource-card__meta">
        <span className="resource-card__author">{User.nickname}</span>
        <span className="resource-card__appeared">З’явився:</span>
        <span className="resource-card__date">{origination_date}</span>
      </div>

      <div className="resource-card__tags">
        {DevelopmentDirections.map((direction) => (
          <span key={direction.development_direction_Id} className="resource-card__tag">
            {direction.development_direction_name}
          </span>
        ))}  
      </div>

      <div className="resource-card__stats">
        <span className="resource-card__likes"> <ThumbsUp size={16} /> {likes_cache}</span>
        <span className="resource-card__views"> <Eye size={16} /> {views_cache}</span>
      </div>

      <div className="resource-card__actions">
        <button 
            className="resource-card__button"
            onClick={() => onNavigate(resource_Id)}
        >
            Переглянути
        </button>
      </div>

      <div className="resource-card__icons">
        {stackMode ? (
            // STACK MODE CONTROLS
            <button 
                className={`stack-toggle-btn ${isInStack ? 'remove' : 'add'}`}
                onClick={(e) => { e.stopPropagation(); onToggleStack(resource_Id, isInStack); }}
                title={isInStack ? "Видалити зі стеку" : "Додати до стеку"}
            >
                {isInStack ? <div style={{display:'flex', alignItems:'center', gap:'4px'}}><Check size={18}/> В стеку</div> : <Plus size={22} />}
            </button>
        ) : (
            // STANDARD CONTROLS
            <>
                <button 
                    className={`icon-action-btn ${isWatchLater ? 'active' : ''}`}
                    onClick={(e) => handleInteraction(e, 'is_in_view_later', isWatchLater, setIsWatchLater)}
                    title="Переглянути пізніше"
                >
                    <Clock size={22} />
                </button>
                <button 
                    className={`icon-action-btn ${isFav ? 'active' : ''}`}
                    onClick={(e) => handleInteraction(e, 'is_in_favourites', isFav, setIsFav)}
                    title="Додати в обране"
                >
                    <Star size={22} fill={isFav ? "currentColor" : "none"} />
                </button>
            </>
        )}
      </div>
    </div>
  )
}


const SearchPanelComponent = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const [directions, setDirections] = useState([]);
    const [loadingDirections, setLoading] = useState(true);
    const [directionsError, setDirectionsErrorError] = useState(null);

    // Form states
    const [searchName, setSearchName] = useState('');
    const [searchAuthor, setSearchAuthor] = useState('');
    const [selectedDirections, setSelectedDirections] = useState([]);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [isRecommended, setIsRecommended] = useState(false);
    
    // Default sorting
    const [sortBy, setSortBy] = useState('PublishDate');
    const [sortOrder, setSortOrder] = useState('DESC');

    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    const authorInputRef = useRef(null);

    // Ініціалізація полів форми з URL
    useEffect(() => {
        setSearchName(searchParams.get('name') || '');
        setSearchAuthor(searchParams.get('author') || '');
        setDateFrom(searchParams.get('dateFrom') || '');
        setDateTo(searchParams.get('dateTo') || '');
        setIsRecommended(searchParams.get('is_recommended') === 'true');
        setSortBy(searchParams.get('sortBy') || 'PublishDate');
        setSortOrder(searchParams.get('sortOrder') || 'DESC');
        
        const dirsParam = searchParams.get('directions');
        if (dirsParam) {
            setSelectedDirections(dirsParam.split(',').map(Number));
        } else {
            setSelectedDirections([]);
        }
        
        if (searchParams.get('author') || searchParams.get('dateFrom')) {
            setIsAdvancedOpen(true);
        }
    }, [searchParams]);

    // Завантаження напрямів
    useEffect(() => { 
      const fetchDirections = async () => {
            try {
                const response = await axios.get(`${API_CONFIG.BASE_URL}/developmentDirection/getAll`);
                setDirections(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching directions:', err);
                setDirectionsErrorError('Failed to load directions.');
                setLoading(false);
            }
        };
        fetchDirections();
    }, []);

    // Handlers
    const handleNameChange = (e) => setSearchName(e.target.value);
    const handleAuthorChange = (e) => setSearchAuthor(e.target.value);
    
    const handleDirectionToggle = (id) => {
        setSelectedDirections(prev => {
            if (prev.includes(id)) return prev.filter(d => d !== id);
            return [...prev, id];
        });
    };

    const formatDateToYYYYMMDD = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleDateFromChange = (e) => {
        const val = e.target.value;
        setDateFrom(val);
        if (val && !dateTo) {
            const today = new Date();
            setDateTo(formatDateToYYYYMMDD(today));
        }
    };
    const handleDateToChange = (e) => setDateTo(e.target.value);
    const handleRecommendedChange = (e) => setIsRecommended(e.target.checked);
    const handleSortByChange = (e) => setSortBy(e.target.value);
    const handleSortOrderChange = (e) => setSortOrder(e.target.value);

    const handleSearchClick = () => {
        const newParams = {};

        const currentStackId = searchParams.get('stackId');
        if (currentStackId) newParams.stackId = currentStackId;

        if (searchName.trim()) newParams.name = searchName.trim();
        if (searchAuthor.trim()) newParams.author = searchAuthor.trim();
        if (selectedDirections.length > 0) newParams.directions = selectedDirections.join(',');
        if (isRecommended) newParams.is_recommended = 'true';
        if (dateFrom) newParams.dateFrom = dateFrom;
        if (dateTo) newParams.dateTo = dateTo;
        
        newParams.sortBy = sortBy;
        newParams.sortOrder = sortOrder;
        
        newParams.page = 1;

        setSearchParams(newParams);
    };

    useEffect(() => {
        if (isAdvancedOpen) {
            authorInputRef.current?.focus();
        }
    }, [isAdvancedOpen]);

    const ToggleArrow = ({ isOpen }) => (
        <div className={`search-panel-v2__toggle-arrow ${isOpen ? 'search-panel-v2__toggle-arrow--open' : ''}`}></div>
    );

    return (
        <div className='library-page__search-panel library-page__search-panel--V2'>
             <div className='search-panel-v2__main-layout'>
                <div className='search-panel-v2__left-column'>
                    <div className='search-panel-v3__section-group'>
                        <div className="search-panel__main-label">Шукати:</div>
                        <input 
                            type="text" 
                            placeholder='Назва' 
                            className='search-panel__input search-panel-v2__input-full-width' 
                            value={searchName}
                            onChange={handleNameChange}
                        />
                    </div>
                     <div className='search-panel-v3__section-group'>
                        <div className="search-panel__main-label">Напрями:</div>
                        <div className='search-panel__directions'>
                            {
                                loadingDirections ? <div className="loading">Loading...</div> :
                                directionsError ? <div className="error">Error</div> :
                                directions.map((direction) => (
                                    <div className='search-panel__filter-item' key={direction.development_direction_Id}>
                                        <input 
                                            type="checkbox" 
                                            id={`dir-${direction.development_direction_Id}`}
                                            checked={selectedDirections.includes(direction.development_direction_Id)}
                                            onChange={() => handleDirectionToggle(direction.development_direction_Id)}
                                        />
                                        <label htmlFor={`dir-${direction.development_direction_Id}`}>
                                            {direction.development_direction_name}
                                        </label>
                                    </div>
                                ))
                            }
                        </div>
                    </div>

                    <div className='search-panel-v2__collapsible-section'>
                         <div className='search-panel-v2__collapsible-header' onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}>
                            <div className="search-panel__label" style={{fontSize: "1rem"}}>Просунуті опції</div>
                            <ToggleArrow isOpen={isAdvancedOpen} />
                        </div>
                        <div className={`search-panel-v2__collapsible-content ${isAdvancedOpen ? 'search-panel-v2__collapsible-content--open' : ''}`}>
                             <div className='search-panel-v3__section-group'>
                                <input 
                                    ref={authorInputRef}
                                    type="text" 
                                    placeholder='Автор' 
                                    className='search-panel__input search-panel-v2__input-full-width' 
                                    value={searchAuthor}
                                    onChange={handleAuthorChange}
                                />
                                <div className='row-flex-container'>
                                    <span>Створено від</span>
                                    <input 
                                        type="date" 
                                        className='search-panel__input--date'
                                        value={dateFrom}
                                        onChange={handleDateFromChange}
                                    />
                                    <span>до</span>
                                    <input
                                        type="date" 
                                        className='search-panel__input--date'
                                        value={dateTo}
                                        onChange={handleDateToChange}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='search-panel-v2__right-column'>
                    <div className='search-panel-v2__right-column-group'>
                        <div className="search-panel__label">Сортувати:</div>
                        <select 
                            className='search-panel__dropdown'
                            value={sortBy}
                            onChange={handleSortByChange}
                        >
                            <option value="PublishDate">Дата публікації</option>
                            <option value="OriginationDate">Дата появи</option>
                            <option value="ViewCount">Кількість переглядів</option>
                            <option value="LikeCount">Кількість лайків</option>
                        </select>
                        <select 
                            className='search-panel__dropdown'
                            value={sortOrder}
                            onChange={handleSortOrderChange}
                        >
                            <option value="DESC">За спаданням</option>
                            <option value="ASC">За зростанням</option>
                        </select>
                    </div>

                    <div className='search-panel-v2__right-column-group'>
                        <div className='row-flex-container'>
                            <input 
                                type="checkbox" 
                                id="is-recommended-v3" 
                                checked={isRecommended}
                                onChange={handleRecommendedChange}
                            />
                            <label htmlFor="is-recommended-v3">Тільки рекомендовані</label>
                        </div>
                        
                        <button className='search-panel__search-button' onClick={handleSearchClick}>
                            Знайти
                        </button>
                    </div>
                </div>
             </div>
        </div>
    );
}

export default LibraryPage