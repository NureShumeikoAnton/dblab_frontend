import React, { useEffect, useState, useRef } from 'react'
import './styles/LibraryPage.css'
import axios from 'axios';
import API_CONFIG from '../config/api.js';
import useAuthHeader from 'react-auth-kit/hooks/useAuthHeader';
import { useNavigate, useSearchParams } from "react-router-dom";
import { Clock, Eye, Plus, Star, ThumbsUp, TrendingUp, Check, X } from 'lucide-react';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';

const LibraryPage = () => {
  const [resources, setResources] = useState([]);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  
  // Stack mode state
  const [searchParams] = useSearchParams();
  const stackId = searchParams.get('stackId'); // Check if we are in stack filling mode
  const [stackResourceIds, setStackResourceIds] = useState(new Set());
  const isStackMode = !!stackId;

  const authHeader = useAuthHeader();
  const authUser = useAuthUser();
  const navigate = useNavigate();

  const menuTimeoutRef = useRef(null);

  // Fetch Resources
  useEffect(() => {
    if(!authHeader) return; 
    axios.get(`${API_CONFIG.BASE_URL}/resource/getRecentResourcesPreview/1/10`,
              {
               headers: {
                 'Authorization': authHeader.split(' ')[1],
               }
             })
      .then(response => {
        setResources(response.data);
      })
      .catch(error => {
        console.error("Error fetching resources:", error);
      });
  }, [authHeader]);

  // Stack mode logic (fetch existing resources in stack)
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

  // Stack mode handler
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

  return (
    <div className='library-page'>
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
            Результати пошуку:
          </div>
          <div className='search-results__list'>
            {resources?.map((resource) => (
              <ResourceSearchResultComponent 
                key={resource.resource_Id} 
                resource={resource}
                stackMode={isStackMode}
                isInStack={stackResourceIds.has(resource.resource_Id)}
                onToggleStack={handleToggleStackResource}
              />
            ))}
          </div>
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

const ResourceSearchResultComponent = ({ resource, stackMode, isInStack, onToggleStack }) => {
  const navigate = useNavigate();
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
            onClick={() => navigate(`/library/resource/${resource_Id}`)}
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
    const [directions, setDirections] = useState([]);
    const [loadingDirections, setLoading] = useState(true);
    const [directionsError, setDirectionsErrorError] = useState(null);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    useEffect(() => { 
      const fetchDirections = async () => {
            try {
                const response = await axios.get(`${API_CONFIG.BASE_URL}/developmentDirection/getAll`);
                setDirections(response.data);

                setLoading(false);
            } catch (err) {
                console.error('Error fetching directions:', err);
                setDirectionsErrorError('Failed to load directions. Please try again later.');
                setLoading(false);
            }
        };
        fetchDirections();
    }, []);

    const handleDateFromChange = (event) => {
        const newDateFrom = event.target.value;
        setDateFrom(newDateFrom);

        if (newDateFrom && dateTo === '') {
            const today = new Date();
            setDateTo(formatDateToYYYYMMDD(today));
        } else if(!newDateFrom) {
            setDateTo('');
        }
    };

    const handleDateToChange = (event) => {
        const newDateTo = event.target.value;
        setDateTo(newDateTo);
    };

    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    
    const authorInputRef = useRef(null);
    const dateFromInputRef = useRef(null); 

    useEffect(() => {
        if (isAdvancedOpen) {
            authorInputRef.current?.focus();
        }
    }, [isAdvancedOpen]);

    useEffect(() => {
        if (isAdvancedOpen) {
            const timer = setTimeout(() => {
                try {
                    // dateFromInputRef.current?.showPicker(); 
                } catch (err) {
                    console.warn("showPicker() fallback.", err);
                    // dateFromInputRef.current?.focus();
                }
            }, 100); // невелика затримка
            return () => clearTimeout(timer); 
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
                        />
                    </div>
                    <div className='search-panel-v3__section-group'>
                        <div className="search-panel__main-label">Напрями:</div>
                        <div className='search-panel__directions'>
                            {
                                loadingDirections ? <div className="loading">Loading directions...</div> :
                                directionsError ? <div className="error">{directionsError}</div> :
                                directions.map((direction) => (
                                    <div className='search-panel__filter-item' key={direction.development_direction_Id}>
                                        <input type="checkbox" id={direction.development_direction_Id} name={direction.development_direction_name} />
                                        <label htmlFor={direction.development_direction_Id}>{direction.development_direction_name}</label>
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
                                />
                                <div className='row-flex-container'>
                                    <span>Створено від</span>
                                    <input 
                                        ref={dateFromInputRef}
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
                        <select className='search-panel__dropdown'>
                            <option value="ViewCount">Кількість переглядів</option>
                            <option value="LikeCount">Кількість лайків</option>
                            <option value="OriginationDate">Дата появи</option>
                            <option value="PublishDate">Дата публікації</option>
                        </select>
                        <select className='search-panel__dropdown'>
                            <option value="ASC">За зростанням</option>
                            <option value="DESC">За спаданням</option>
                        </select>
                    </div>

                    <div className='search-panel-v2__right-column-group'>
                        <div className='row-flex-container'>
                            <input type="checkbox" id="is-recommended-v3" name="is-recommended-v3" />
                            <label htmlFor="is-recommended-v3">Тільки рекомендовані</label>
                        </div>
                        
                        <button className='search-panel__search-button'>Знайти</button>
                    </div>

                </div>

            </div>
        </div>
    );
}

export default LibraryPage