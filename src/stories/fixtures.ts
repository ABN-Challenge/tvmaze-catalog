import type { Show } from '../domain/types'

export const demoShow: Show = {
  id: 1,
  name: 'Band of Brothers',
  rating: { average: 9.0 },
  genres: ['Drama', 'Action', 'War'],
  status: 'Ended',
  premiered: '2001-09-09',
  summary:
    '<p>Drawn from interviews with survivors of Easy Company, <b>Band of Brothers</b> chronicles their experiences.</p>',
  officialSite: 'https://www.hbo.com/',
  network: { name: 'HBO' },
  image: {
    medium: 'https://static.tvmaze.com/uploads/images/medium_portrait/0/81.jpg',
    original: 'https://static.tvmaze.com/uploads/images/original_untouched/0/81.jpg',
  },
  _embedded: {
    cast: [
      { person: { name: 'Damian Lewis' }, character: { name: 'Richard Winters' } },
      { person: { name: 'Ron Livingston' }, character: { name: 'Lewis Nixon' } },
    ],
  },
}

export const demoShows: Show[] = [
  demoShow,
  {
    id: 3,
    name: 'Person of Interest',
    genres: ['Action', 'Crime', 'Science-Fiction'],
    rating: { average: 8.8 },
    image: { medium: 'https://static.tvmaze.com/uploads/images/medium_portrait/163/407679.jpg' },
  },
  {
    id: 2,
    name: 'Unrated Demo',
    genres: ['Drama'],
    rating: { average: null },
    image: null,
  },
]
